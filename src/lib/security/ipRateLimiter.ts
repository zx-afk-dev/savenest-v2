import type { NextApiRequest } from 'next';

/**
 * In-memory, per-Function-instance rate limiting.
 *
 * On Netlify, each warm Function instance keeps this module's state alive
 * between invocations it personally handles, which is enough to blunt
 * bursty/automated abuse from a single IP within a short window. It is
 * intentionally NOT a substitute for the durable, cross-instance GLOBAL
 * quota (see globalQuota.ts, which uses Netlify Blobs) — that one is the
 * source of truth for "60 requests/day total". This one only protects
 * against a single client hammering an endpoint faster than a human could.
 *
 * Buckets are namespaced by `scope` (e.g. "download", "chat") so that, say,
 * someone chatting a lot with the AI assistant doesn't get throttled out of
 * clicking the Download button, and vice versa — each endpoint gets its own
 * independent counters even though they share this same module.
 */

interface IpRecord {
  timestamps: number[];
  lastKeyHash: string | null;
  lastRequestAt: number;
  inFlight: boolean;
}

const ipRecords = new Map<string, IpRecord>();

// Periodically forget entries we haven't seen in a while so the map can't
// grow unbounded over a long-lived warm instance.
const MAX_TRACKED_ENTRIES = 5000;

function getRecord(scope: string, ip: string): IpRecord {
  const bucketKey = `${scope}:${ip}`;
  let record = ipRecords.get(bucketKey);
  if (!record) {
    record = { timestamps: [], lastKeyHash: null, lastRequestAt: 0, inFlight: false };
    if (ipRecords.size >= MAX_TRACKED_ENTRIES) {
      const oldestKey = ipRecords.keys().next().value;
      if (oldestKey) ipRecords.delete(oldestKey);
    }
    ipRecords.set(bucketKey, record);
  }
  return record;
}

export function getClientIp(req: NextApiRequest): string {
  // Netlify sets this header at the edge; it cannot be spoofed by the client
  // because Netlify overwrites it, unlike a generic X-Forwarded-For which a
  // client could forge before it reaches an origin server you control.
  const nfIp = req.headers['x-nf-client-connection-ip'];
  if (typeof nfIp === 'string' && nfIp) return nfIp;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim();
  }

  return req.socket.remoteAddress ?? 'unknown';
}

export interface RateLimitCheck {
  allowed: boolean;
  reason?: 'RATE_LIMITED' | 'COOLDOWN' | 'DUPLICATE_IN_FLIGHT';
  retryAfterSeconds?: number;
}

export interface RateLimitOptions {
  max: number;
  windowSeconds: number;
  cooldownSeconds: number;
}

/** Simple, dependency-free string hash for comparing "same request" cheaply. */
function hashKey(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/**
 * Checks sliding-window rate limit, request cooldown, and duplicate
 * in-flight requests for a single client IP within a given scope. `key` is
 * whatever the endpoint wants to treat as "the same request" for cooldown/
 * duplicate purposes — a video URL for downloads, a chat message for chat.
 */
export function checkIpRateLimit(
  scope: string,
  ip: string,
  key: string,
  options: RateLimitOptions,
): RateLimitCheck {
  const now = Date.now();
  const record = getRecord(scope, ip);
  const windowMs = options.windowSeconds * 1000;

  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= options.max) {
    const oldest = record.timestamps[0]!;
    return {
      allowed: false,
      reason: 'RATE_LIMITED',
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  const keyHash = hashKey(key);
  const sinceLast = (now - record.lastRequestAt) / 1000;
  if (record.lastKeyHash === keyHash && sinceLast < options.cooldownSeconds) {
    return {
      allowed: false,
      reason: 'COOLDOWN',
      retryAfterSeconds: Math.ceil(options.cooldownSeconds - sinceLast),
    };
  }

  if (record.inFlight && record.lastKeyHash === keyHash) {
    return { allowed: false, reason: 'DUPLICATE_IN_FLIGHT' };
  }

  return { allowed: true };
}

export function markRequestStart(scope: string, ip: string, key: string): void {
  const record = getRecord(scope, ip);
  record.timestamps.push(Date.now());
  record.lastKeyHash = hashKey(key);
  record.lastRequestAt = Date.now();
  record.inFlight = true;
}

export function markRequestEnd(scope: string, ip: string): void {
  const record = ipRecords.get(`${scope}:${ip}`);
  if (record) record.inFlight = false;
}

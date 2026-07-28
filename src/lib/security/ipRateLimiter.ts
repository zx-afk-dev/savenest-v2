import type { NextApiRequest } from 'next';
import {
  IP_COOLDOWN_SECONDS,
  IP_RATE_LIMIT_MAX,
  IP_RATE_LIMIT_WINDOW_SECONDS,
} from '@/lib/constants';

/**
 * In-memory, per-Function-instance rate limiting.
 *
 * On Netlify, each warm Function instance keeps this module's state alive
 * between invocations it personally handles, which is enough to blunt
 * bursty/automated abuse from a single IP within a short window. It is
 * intentionally NOT a substitute for the durable, cross-instance GLOBAL
 * quota (see globalQuota.ts, which uses Netlify Blobs) — that one is the
 * source of truth for "60 requests/day total". This one only protects
 * against a single client hammering the endpoint faster than a human could.
 */

interface IpRecord {
  timestamps: number[];
  lastUrlHash: string | null;
  lastRequestAt: number;
  inFlight: boolean;
}

const ipRecords = new Map<string, IpRecord>();

// Periodically forget IPs we haven't seen in a while so the map can't grow
// unbounded over a long-lived warm instance.
const MAX_TRACKED_IPS = 5000;

function getRecord(ip: string): IpRecord {
  let record = ipRecords.get(ip);
  if (!record) {
    record = { timestamps: [], lastUrlHash: null, lastRequestAt: 0, inFlight: false };
    if (ipRecords.size >= MAX_TRACKED_IPS) {
      const oldestKey = ipRecords.keys().next().value;
      if (oldestKey) ipRecords.delete(oldestKey);
    }
    ipRecords.set(ip, record);
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

/** Simple, dependency-free string hash for comparing "same URL" cheaply. */
function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/**
 * Checks sliding-window rate limit, request cooldown, and duplicate
 * in-flight requests for a single client IP + URL pair.
 */
export function checkIpRateLimit(ip: string, url: string): RateLimitCheck {
  const now = Date.now();
  const record = getRecord(ip);
  const windowMs = IP_RATE_LIMIT_WINDOW_SECONDS * 1000;

  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= IP_RATE_LIMIT_MAX) {
    const oldest = record.timestamps[0]!;
    return {
      allowed: false,
      reason: 'RATE_LIMITED',
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  const urlHash = hashUrl(url);
  const sinceLast = (now - record.lastRequestAt) / 1000;
  if (record.lastUrlHash === urlHash && sinceLast < IP_COOLDOWN_SECONDS) {
    return {
      allowed: false,
      reason: 'COOLDOWN',
      retryAfterSeconds: Math.ceil(IP_COOLDOWN_SECONDS - sinceLast),
    };
  }

  if (record.inFlight && record.lastUrlHash === urlHash) {
    return { allowed: false, reason: 'DUPLICATE_IN_FLIGHT' };
  }

  return { allowed: true };
}

export function markRequestStart(ip: string, url: string): void {
  const record = getRecord(ip);
  record.timestamps.push(Date.now());
  record.lastUrlHash = hashUrl(url);
  record.lastRequestAt = Date.now();
  record.inFlight = true;
}

export function markRequestEnd(ip: string): void {
  const record = ipRecords.get(ip);
  if (record) record.inFlight = false;
}

import type { NextApiRequest } from 'next';
import { SITE_URL } from '@/lib/constants';

function getAllowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS;
  if (fromEnv) {
    return fromEnv.split(',').map((o) => o.trim());
  }
  return [SITE_URL];
}

export interface GuardResult {
  passed: boolean;
  reason?: string;
}

/**
 * Requires that browser-sent requests carry an Origin or Referer header that
 * matches this site. Direct server-to-server calls (no browser) won't send
 * these headers at all — we treat a *mismatched* value as a hard fail, but
 * a completely missing Origin/Referer is tolerated on same-site navigations
 * where some browsers omit it (e.g. Safari's strict referrer policy).
 */
export function validateOriginAndReferer(req: NextApiRequest): GuardResult {
  const allowed = getAllowedOrigins();
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    const isAllowed = allowed.some((o) => origin === o || origin.startsWith(o));
    if (!isAllowed) return { passed: false, reason: 'ORIGIN_NOT_ALLOWED' };
    return { passed: true };
  }

  if (referer) {
    const isAllowed = allowed.some((o) => referer.startsWith(o));
    if (!isAllowed) return { passed: false, reason: 'ORIGIN_NOT_ALLOWED' };
    return { passed: true };
  }

  // No Origin and no Referer: allow, but this is exactly the situation
  // where CSRF-style abuse could hide. Combined with same-site cookies not
  // being used for auth here (there is no auth), and the strict rate
  // limiter, the risk is low. Tighten this if you add authenticated routes.
  return { passed: true };
}

const SUSPICIOUS_USER_AGENT_PATTERNS = [
  /curl/i,
  /wget/i,
  /python-requests/i,
  /scrapy/i,
  /^$/, // empty UA
  /headlesschrome/i,
  /phantomjs/i,
  /bot(?!.*googlebot)/i,
];

const KNOWN_GOOD_CRAWLERS = [/googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i];

/**
 * Heuristic bot detection for the *download* endpoint specifically (not for
 * page rendering — search engine crawlers should still be able to read the
 * marketing pages, robots.txt already scopes that). This only blocks
 * obviously scripted clients hitting the API directly.
 */
export function detectBot(req: NextApiRequest): GuardResult {
  const ua = req.headers['user-agent'] ?? '';

  if (KNOWN_GOOD_CRAWLERS.some((p) => p.test(ua))) {
    // Crawlers shouldn't be calling a POST download API anyway, but if they
    // do, don't treat them as malicious.
    return { passed: true };
  }

  if (SUSPICIOUS_USER_AGENT_PATTERNS.some((p) => p.test(ua))) {
    return { passed: false, reason: 'BOT_DETECTED' };
  }

  // A real browser XHR/fetch call always sets this header; scripts often forget it.
  const requestedWith = req.headers['x-requested-with'];
  const acceptHeader = req.headers.accept ?? '';
  if (!acceptHeader.includes('application/json') && !requestedWith) {
    return { passed: false, reason: 'BOT_DETECTED' };
  }

  return { passed: true };
}

/** Basic structural validation of required headers on the internal API. */
export function validateHeaders(req: NextApiRequest): GuardResult {
  if (req.method !== 'POST') {
    return { passed: false, reason: 'METHOD_NOT_ALLOWED' };
  }
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    return { passed: false, reason: 'INVALID_CONTENT_TYPE' };
  }
  return { passed: true };
}

export function corsHeadersFor(origin: string | undefined): Record<string, string> {
  const allowed = getAllowedOrigins();
  const isAllowed = Boolean(origin && allowed.some((o) => origin === o || origin.startsWith(o)));

  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin as string) : allowed[0]!,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    Vary: 'Origin',
  };
}

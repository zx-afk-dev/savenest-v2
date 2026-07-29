import type { NextApiRequest } from 'next';

/**
 * Extra origins to trust *in addition to* the domain actually serving the
 * request (see `getSelfOrigin` below). Optional — most deployments never
 * need this. Useful if you want a separate marketing/staging domain to be
 * allowed to call this API too.
 */
function getExtraAllowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS;
  if (!fromEnv) return [];
  return fromEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * The origin that is actually serving this request right now, derived from
 * the Host header Netlify forwards to the function. This is what a same-site
 * browser fetch/XHR call will always send as `Origin` — regardless of
 * whether the app is running on its final custom domain, Netlify's default
 * `*.netlify.app` subdomain, a deploy-preview URL, or `localhost` during
 * development. Checking against this (rather than only a single hardcoded
 * configured URL) is what makes origin validation work correctly out of the
 * box on every deployment, without needing an env var to be kept in sync.
 */
function getSelfOrigin(req: NextApiRequest): string | null {
  const hostHeader = req.headers['x-forwarded-host'] ?? req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!host) return null;

  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader)?.split(',')[0]?.trim();

  return `${proto || 'https'}://${host}`;
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '').toLowerCase();
}

function isTrustedOrigin(req: NextApiRequest, candidate: string): boolean {
  const normalizedCandidate = normalizeOrigin(candidate);
  const selfOrigin = getSelfOrigin(req);

  if (selfOrigin && normalizedCandidate === normalizeOrigin(selfOrigin)) return true;
  return getExtraAllowedOrigins().some((o) => normalizeOrigin(o) === normalizedCandidate);
}

export interface GuardResult {
  passed: boolean;
  reason?: string;
}

/**
 * Requires that browser-sent requests carry an Origin or Referer header that
 * matches the site actually serving this request. Direct server-to-server
 * calls (no browser) won't send these headers at all — we treat a
 * *mismatched* value as a hard fail, but a completely missing Origin/Referer
 * is tolerated on same-site navigations where some browsers omit it (e.g.
 * Safari's strict referrer policy).
 */
export function validateOriginAndReferer(req: NextApiRequest): GuardResult {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    if (!isTrustedOrigin(req, origin)) return { passed: false, reason: 'ORIGIN_NOT_ALLOWED' };
    return { passed: true };
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!isTrustedOrigin(req, refererOrigin)) {
        return { passed: false, reason: 'ORIGIN_NOT_ALLOWED' };
      }
    } catch {
      return { passed: false, reason: 'ORIGIN_NOT_ALLOWED' };
    }
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

export function corsHeadersFor(req: NextApiRequest): Record<string, string> {
  const origin = req.headers.origin;
  const selfOrigin = getSelfOrigin(req);
  const allowOrigin = origin && isTrustedOrigin(req, origin) ? origin : (selfOrigin ?? '');

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    Vary: 'Origin',
  };
}

import type { NextApiRequest } from 'next';
import { getClientIp } from '@/lib/security/ipRateLimiter';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileCheckResult {
  passed: boolean;
  reason?: 'NOT_CONFIGURED' | 'MISSING_TOKEN' | 'VERIFICATION_FAILED' | 'VERIFY_REQUEST_ERROR';
}

/**
 * Verifies a Cloudflare Turnstile token server-side. Fully optional: if
 * TURNSTILE_SECRET_KEY isn't set, this immediately returns "passed" so the
 * whole feature is opt-in and the site works normally without a Cloudflare
 * account. Once configured, a request with a missing/invalid token is
 * rejected — this is what actually blocks bots, since the client-side
 * widget alone is just UI (any check can be skipped by a script that never
 * loads the widget at all).
 */
export async function verifyTurnstile(
  req: NextApiRequest,
  token: string | undefined,
): Promise<TurnstileCheckResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return { passed: true, reason: 'NOT_CONFIGURED' };
  }

  if (!token) {
    return { passed: false, reason: 'MISSING_TOKEN' };
  }

  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
      remoteip: getClientIp(req),
    });

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] };

    if (!result.success) {
      console.warn('[turnstile] verification failed:', result['error-codes']);
      return { passed: false, reason: 'VERIFICATION_FAILED' };
    }

    return { passed: true };
  } catch (err) {
    // Inconclusive (network hiccup talking to Cloudflare), not evidence of
    // abuse — fail OPEN here so a Cloudflare-side outage can't take down
    // downloads/chat entirely. All the other layers (rate limit, origin,
    // bot UA checks) still apply regardless. Logged so it's visible.
    console.error('[turnstile] error calling siteverify, allowing request through:', err);
    return { passed: true, reason: 'VERIFY_REQUEST_ERROR' };
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import type { DownloadApiResponse, DownloadErrorCode } from '@/types';
import { validateSupportedUrl, sanitizeInput } from '@/lib/security/urlValidator';
import {
  validateHeaders,
  validateOriginAndReferer,
  detectBot,
  corsHeadersFor,
} from '@/lib/security/requestGuards';
import {
  checkIpRateLimit,
  getClientIp,
  markRequestEnd,
  markRequestStart,
} from '@/lib/security/ipRateLimiter';
import { tryConsumeGlobalQuota } from '@/lib/store/globalQuota';
import { getCached, setCached } from '@/lib/cache/cacheStore';
import { fetchFromUpstream, UpstreamError } from '@/lib/api/blckrose';
import { IP_COOLDOWN_SECONDS, IP_RATE_LIMIT_MAX, IP_RATE_LIMIT_WINDOW_SECONDS } from '@/lib/constants';

// Body payload validation (defense in depth on top of validateSupportedUrl).
const RequestBodySchema = z.object({
  url: z.string().min(1).max(2048),
});

function fail(
  res: NextApiResponse<DownloadApiResponse>,
  status: number,
  code: DownloadErrorCode,
  message: string,
) {
  res.status(status).json({ success: false, code, message });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DownloadApiResponse>,
) {
  // --- CORS / preflight -----------------------------------------------
  const corsHeaders = corsHeadersFor(req);
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // --- Header / method validation --------------------------------------
  const headerCheck = validateHeaders(req);
  if (!headerCheck.passed) {
    fail(res, 405, 'VALIDATION_FAILED', 'Metode atau header request tidak valid.');
    return;
  }

  // --- Origin / Referer (CSRF-style protection) -------------------------
  const originCheck = validateOriginAndReferer(req);
  if (!originCheck.passed) {
    fail(res, 403, 'ORIGIN_NOT_ALLOWED', 'Request berasal dari origin yang tidak diizinkan.');
    return;
  }

  // --- Bot / scripted client detection ----------------------------------
  const botCheck = detectBot(req);
  if (!botCheck.passed) {
    fail(res, 403, 'BOT_DETECTED', 'Request terdeteksi sebagai bot otomatis.');
    return;
  }

  // --- Payload validation & sanitization ---------------------------------
  const parsedBody = RequestBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    fail(res, 400, 'VALIDATION_FAILED', 'Payload request tidak valid.');
    return;
  }
  const cleanedInput = sanitizeInput(parsedBody.data.url);

  const urlCheck = validateSupportedUrl(cleanedInput);
  if (!urlCheck.valid || !urlCheck.normalizedUrl) {
    fail(res, 400, 'INVALID_URL', urlCheck.reason ?? 'URL tidak valid.');
    return;
  }
  const targetUrl = urlCheck.normalizedUrl;

  // --- Per-IP rate limit, cooldown, duplicate-request guard --------------
  const ip = getClientIp(req);
  const rateLimit = checkIpRateLimit('download', ip, targetUrl, {
    max: IP_RATE_LIMIT_MAX,
    windowSeconds: IP_RATE_LIMIT_WINDOW_SECONDS,
    cooldownSeconds: IP_COOLDOWN_SECONDS,
  });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds ?? 5));
    fail(
      res,
      429,
      'RATE_LIMITED',
      rateLimit.reason === 'DUPLICATE_IN_FLIGHT'
        ? 'Request yang sama sedang diproses. Tunggu sebentar.'
        : 'Terlalu banyak request. Coba lagi sebentar lagi.',
    );
    return;
  }
  markRequestStart('download', ip, targetUrl);

  try {
    // --- Cache lookup ------------------------------------------------
    const cached = await getCached(targetUrl);
    if (cached) {
      res.status(200).json({ success: true, data: cached });
      return;
    }

    // --- Global daily quota (shared across all users, resets 00:00 WIB) ---
    const quota = await tryConsumeGlobalQuota();
    if (!quota.allowed) {
      fail(
        res,
        503,
        'GLOBAL_QUOTA_EXCEEDED',
        'Hari ini kuota download SaveNest sudah habis. Silakan kembali besok.',
      );
      return;
    }

    // --- Call upstream API (single source of truth for media data) --------
    const result = await fetchFromUpstream(targetUrl);
    await setCached(targetUrl, result);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof UpstreamError) {
      if (err.kind === 'TIMEOUT') {
        fail(res, 504, 'UPSTREAM_TIMEOUT', 'Server sumber tidak merespon. Coba lagi.');
        return;
      }
      fail(
        res,
        502,
        'UPSTREAM_ERROR',
        err.kind === 'HTTP' && err.message
          ? err.message
          : 'Gagal mengambil data dari server sumber.',
      );
      return;
    }
    fail(res, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan pada server.');
  } finally {
    markRequestEnd('download', ip);
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '10kb' }, // payload is just a URL string — keep this tight
  },
};

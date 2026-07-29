import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { ChatApiResponse, ChatErrorCode } from '@/types';
import { extractSupportedUrl, sanitizeInput } from '@/lib/security/urlValidator';
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
import { fetchChatReply, ChatUpstreamError } from '@/lib/api/theresav';
import { buildScopedPrompt, type ChatGrounding } from '@/lib/ai/scopedPrompt';
import {
  CHAT_COOLDOWN_SECONDS,
  CHAT_MAX_PROMPT_LENGTH,
  CHAT_RATE_LIMIT_MAX,
  CHAT_RATE_LIMIT_WINDOW_SECONDS,
} from '@/lib/constants';

const RequestBodySchema = z.object({
  message: z.string().min(1).max(CHAT_MAX_PROMPT_LENGTH),
  // Client-generated conversation id (kept in the browser only — SaveNest
  // has no database/accounts). Loosely validated; a missing/malformed one is
  // simply replaced with a fresh id rather than treated as a hard error.
  chatId: z.string().max(64).optional(),
});

const CHAT_ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;

function fail(
  res: NextApiResponse<ChatApiResponse>,
  status: number,
  code: ChatErrorCode,
  message: string,
) {
  res.status(status).json({ success: false, code, message });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ChatApiResponse>) {
  const corsHeaders = corsHeadersFor(req);
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const headerCheck = validateHeaders(req);
  if (!headerCheck.passed) {
    fail(res, 405, 'VALIDATION_FAILED', 'Metode atau header request tidak valid.');
    return;
  }

  const originCheck = validateOriginAndReferer(req);
  if (!originCheck.passed) {
    fail(res, 403, 'ORIGIN_NOT_ALLOWED', 'Request berasal dari origin yang tidak diizinkan.');
    return;
  }

  const botCheck = detectBot(req);
  if (!botCheck.passed) {
    fail(res, 403, 'BOT_DETECTED', 'Request terdeteksi sebagai bot otomatis.');
    return;
  }

  const parsedBody = RequestBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    fail(res, 400, 'VALIDATION_FAILED', 'Pesan tidak valid.');
    return;
  }

  const userMessage = sanitizeInput(parsedBody.data.message);
  if (!userMessage) {
    fail(res, 400, 'VALIDATION_FAILED', 'Pesan tidak boleh kosong.');
    return;
  }

  const chatId =
    parsedBody.data.chatId && CHAT_ID_PATTERN.test(parsedBody.data.chatId)
      ? parsedBody.data.chatId
      : randomUUID();

  const ip = getClientIp(req);
  const rateLimit = checkIpRateLimit('chat', ip, userMessage, {
    max: CHAT_RATE_LIMIT_MAX,
    windowSeconds: CHAT_RATE_LIMIT_WINDOW_SECONDS,
    cooldownSeconds: CHAT_COOLDOWN_SECONDS,
  });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds ?? 3));
    fail(
      res,
      429,
      'RATE_LIMITED',
      rateLimit.reason === 'DUPLICATE_IN_FLIGHT'
        ? 'Pesan yang sama sedang diproses. Tunggu sebentar.'
        : 'Terlalu banyak pesan. Tunggu sebentar sebelum kirim lagi.',
    );
    return;
  }
  markRequestStart('chat', ip, userMessage);

  try {
    // Every chat turn draws from the same shared daily quota as the
    // Download button — one AI reply (with or without a download attached)
    // = 1 unit, so chatting can't be used to bypass the global limit.
    const quota = await tryConsumeGlobalQuota();
    if (!quota.allowed) {
      fail(
        res,
        503,
        'GLOBAL_QUOTA_EXCEEDED',
        'Hari ini kuota SaveNest sudah habis. Silakan kembali besok.',
      );
      return;
    }

    // If the user's message contains a supported video URL, process the
    // download as part of this same turn (reusing the exact same cache +
    // upstream client as the main Download button) so the AI can ground its
    // reply in real data instead of guessing, and the chat UI can render
    // download buttons directly. This does NOT consume a second quota unit.
    let grounding: ChatGrounding | undefined;
    const urlMatch = extractSupportedUrl(userMessage);

    if (urlMatch.valid && urlMatch.normalizedUrl) {
      try {
        let downloadResult = await getCached(urlMatch.normalizedUrl);
        if (!downloadResult) {
          downloadResult = await fetchFromUpstream(urlMatch.normalizedUrl);
          await setCached(urlMatch.normalizedUrl, downloadResult);
        }
        grounding = { type: 'download_success', result: downloadResult };
      } catch (err) {
        const message =
          err instanceof UpstreamError ? err.message : 'Gagal mengambil data dari server sumber.';
        grounding = { type: 'download_error', message };
      }
    }

    const scopedPrompt = buildScopedPrompt(userMessage, grounding);
    const reply = await fetchChatReply(scopedPrompt, chatId);

    res.status(200).json({
      success: true,
      data: {
        reply,
        chatId,
        download: grounding?.type === 'download_success' ? grounding.result : undefined,
      },
    });
  } catch (err) {
    if (err instanceof ChatUpstreamError) {
      if (err.kind === 'TIMEOUT') {
        fail(res, 504, 'UPSTREAM_TIMEOUT', 'Asisten AI tidak merespon. Coba lagi.');
        return;
      }
      fail(res, 502, 'UPSTREAM_ERROR', 'Gagal menghubungi asisten AI. Coba lagi.');
      return;
    }
    fail(res, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan pada server.');
  } finally {
    markRequestEnd('chat', ip);
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '10kb' },
  },
};

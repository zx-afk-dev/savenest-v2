import { REQUEST_TIMEOUT_MS } from '@/lib/constants';

// gemini-3.5-flash is Google's current fast/cost-effective model, well
// suited to a lightweight support chatbot and available on the free tier
// via a Google AI Studio API key. Override with GEMINI_MODEL if Google
// renames/retires it later — model names on the free tier churn every few
// months (e.g. the 2.0 Flash line was retired June 2026), so this is kept
// configurable rather than hardcoded deep in the call site.
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiErrorKind =
  | 'NOT_CONFIGURED'
  | 'TIMEOUT'
  | 'HTTP'
  | 'RATE_LIMITED'
  | 'PARSE'
  | 'BLOCKED'
  | 'UNKNOWN';

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly kind: GeminiErrorKind = 'UNKNOWN',
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export interface GeminiTurn {
  role: 'user' | 'model';
  text: string;
}

interface GeminiResponsePayload {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }>; role?: string };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

async function attemptGenerate(systemInstruction: string, turns: GeminiTurn[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY belum diatur di environment.', 'NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/${MODEL}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        // Current recommended auth method per Gemini API docs (replaces the
        // older `?key=` query-string style — keeps the key out of URLs/logs).
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.6,
        },
      }),
    });

    if (!response.ok) {
      const bodySnippet = await response.text().catch(() => '');
      console.error(`[gemini] HTTP ${response.status}: ${bodySnippet.slice(0, 300)}`);

      if (response.status === 429) {
        throw new GeminiError(
          'Batas pemakaian gratis Gemini API tercapai untuk saat ini. Coba lagi sebentar lagi.',
          'RATE_LIMITED',
        );
      }
      throw new GeminiError(`Upstream responded with status ${response.status}`, 'HTTP');
    }

    let payload: GeminiResponsePayload;
    try {
      payload = (await response.json()) as GeminiResponsePayload;
    } catch (parseErr) {
      console.error('[gemini] non-JSON response', parseErr);
      throw new GeminiError('Respons Gemini tidak valid.', 'PARSE');
    }

    if (payload.promptFeedback?.blockReason) {
      console.warn('[gemini] prompt blocked, reason:', payload.promptFeedback.blockReason);
      throw new GeminiError('Pesan diblokir oleh filter keamanan Gemini.', 'BLOCKED');
    }

    const candidate = payload.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

    if (!text) {
      console.error('[gemini] empty candidate text, finishReason:', candidate?.finishReason);
      if (candidate?.finishReason === 'SAFETY') {
        throw new GeminiError('Balasan diblokir oleh filter keamanan Gemini.', 'BLOCKED');
      }
      throw new GeminiError('Gemini tidak memberikan balasan.', 'PARSE');
    }

    return text;
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      console.error(`[gemini] request timed out after ${REQUEST_TIMEOUT_MS}ms`);
      throw new GeminiError('Gemini tidak merespon.', 'TIMEOUT');
    }
    console.error('[gemini] unexpected error calling Gemini API:', err);
    throw new GeminiError('Kesalahan tak terduga saat menghubungi Gemini.', 'UNKNOWN');
  } finally {
    clearTimeout(timeout);
  }
}

function isTransient(err: GeminiError): boolean {
  if (err.kind === 'TIMEOUT' || err.kind === 'UNKNOWN') return true;
  // 5xx from Google's own infrastructure is worth one retry; 4xx (bad
  // request, rate limit, not-configured) won't be fixed by retrying.
  return /\b(500|502|503|504)\b/.test(err.message);
}

/**
 * Calls the official Gemini API (`generateContent`) with a proper system
 * instruction + multi-turn conversation, and returns the model's reply text.
 * Server-only: never import this from client code, and never expose
 * GEMINI_API_KEY to the browser.
 *
 * One automatic retry is attempted for failures that look transient
 * (network blip, Google-side 5xx) before giving up.
 */
export async function fetchGeminiReply(systemInstruction: string, turns: GeminiTurn[]): Promise<string> {
  try {
    return await attemptGenerate(systemInstruction, turns);
  } catch (err) {
    if (err instanceof GeminiError && isTransient(err)) {
      console.warn('[gemini] transient failure, retrying once:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 400));
      return attemptGenerate(systemInstruction, turns);
    }
    throw err;
  }
}

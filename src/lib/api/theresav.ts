import { REQUEST_TIMEOUT_MS } from '@/lib/constants';

const API_BASE_URL = process.env.CHAT_API_BASE_URL ?? 'https://api.theresav.eu/api/ai/chatgpt';
const API_KEY = process.env.CHAT_API_KEY ?? 'LuEcK';

export class ChatUpstreamError extends Error {
  constructor(
    message: string,
    public readonly kind: 'TIMEOUT' | 'HTTP' | 'PARSE' | 'UNKNOWN' = 'UNKNOWN',
  ) {
    super(message);
    this.name = 'ChatUpstreamError';
  }
}

interface RawChatPayload {
  status?: boolean;
  creator?: string; // API branding, not relevant to us
  result?: string;
  chatId?: string;
  message?: string;
}

/**
 * Calls the upstream AI chat API and returns the assistant's reply text plus
 * the chatId to keep sending on subsequent turns (the upstream service keeps
 * conversation memory server-side, keyed by chatId — we never store the
 * conversation ourselves). Server-only: never import this from client code.
 */
export async function fetchChatReply(prompt: string, chatId: string): Promise<string> {
  const endpoint = new URL(API_BASE_URL);
  endpoint.searchParams.set('prompt', prompt);
  endpoint.searchParams.set('chatId', chatId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'x-apikey': API_KEY,
      },
    });

    if (!response.ok) {
      throw new ChatUpstreamError(`Upstream responded with status ${response.status}`, 'HTTP');
    }

    let payload: RawChatPayload;
    try {
      payload = (await response.json()) as RawChatPayload;
    } catch {
      throw new ChatUpstreamError('Upstream returned a non-JSON response', 'PARSE');
    }

    if (payload.status === false) {
      throw new ChatUpstreamError(payload.message ?? 'Upstream reported failure', 'HTTP');
    }
    if (!payload.result) {
      throw new ChatUpstreamError('Upstream returned an empty reply', 'PARSE');
    }

    return payload.result;
  } catch (err) {
    if (err instanceof ChatUpstreamError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ChatUpstreamError('Upstream request timed out', 'TIMEOUT');
    }
    throw new ChatUpstreamError('Unexpected error calling upstream chat API', 'UNKNOWN');
  } finally {
    clearTimeout(timeout);
  }
}

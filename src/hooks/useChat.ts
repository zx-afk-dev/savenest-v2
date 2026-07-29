import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatApiResponse, DownloadResult } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  download?: DownloadResult;
}

const CHAT_ID_STORAGE_KEY = 'savenest:chatId';

function getOrCreateChatId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.localStorage.getItem(CHAT_ID_STORAGE_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(CHAT_ID_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // Storage may be unavailable (private browsing, disabled cookies, etc.)
    // — fall back to an in-memory id that just won't survive a page reload.
    return crypto.randomUUID();
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatIdRef = useRef<string>('');

  useEffect(() => {
    chatIdRef.current = getOrCreateChatId();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ message: trimmed, chatId: chatIdRef.current }),
      });

      const payload = (await response.json()) as ChatApiResponse;

      if (!payload.success) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'system', content: payload.message },
        ]);
        return;
      }

      if (payload.data.chatId) {
        chatIdRef.current = payload.data.chatId;
        try {
          window.localStorage.setItem(CHAT_ID_STORAGE_KEY, payload.data.chatId);
        } catch {
          // Non-fatal — conversation just won't persist across reloads.
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: payload.data.reply,
          download: payload.data.download,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return { messages, sendMessage, isLoading };
}

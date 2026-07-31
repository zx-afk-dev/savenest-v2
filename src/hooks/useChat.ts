import { useCallback, useEffect, useState } from 'react';
import type { ChatApiResponse, ChatHistoryItem, DownloadResult } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  download?: DownloadResult;
}

const MESSAGES_STORAGE_KEY = 'savenest:chatMessages';
const MAX_STORED_MESSAGES = 20;
const MAX_HISTORY_SENT = 8;

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function persistMessages(messages: ChatMessage[]): void {
  try {
    window.localStorage.setItem(
      MESSAGES_STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
    );
  } catch {
    // Storage may be unavailable (private browsing, quota, etc.) — the
    // conversation just won't survive a page reload, which is non-fatal.
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load any previous conversation once, client-side only (avoids SSR
  // hydration mismatches since localStorage doesn't exist on the server).
  useEffect(() => {
    setMessages(loadStoredMessages());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistMessages(messages);
  }, [messages, hydrated]);

  const sendMessage = useCallback(
    async (text: string, turnstileToken?: string | null) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const history: ChatHistoryItem[] = messages
        .filter((m): m is ChatMessage & { role: 'user' | 'assistant' } => m.role !== 'system')
        .slice(-MAX_HISTORY_SENT)
        .map((m) => ({ role: m.role, content: m.content }));

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
          body: JSON.stringify({
            message: trimmed,
            history,
            ...(turnstileToken ? { turnstileToken } : {}),
          }),
        });

        const payload = (await response.json()) as ChatApiResponse;

        if (!payload.success) {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: 'system', content: payload.message },
          ]);
          return;
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
    },
    [isLoading, messages],
  );

  return { messages, sendMessage, isLoading };
}

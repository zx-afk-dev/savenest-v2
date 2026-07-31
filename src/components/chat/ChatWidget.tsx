import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useChat } from '@/hooks/useChat';
import { useTurnstile } from '@/hooks/useTurnstile';
import { InlineMarkdown } from '@/components/common/InlineMarkdown';
import { ResultCard } from '@/components/home/ResultCard';
import { SITE_NAME } from '@/lib/constants';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading } = useChat();
  const turnstile = useTurnstile();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    void sendMessage(text, turnstile.token);
    turnstile.reset(); // single-use token — line up a fresh one for next time
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={`${SITE_NAME} AI`}
          className="glass-panel-strong fixed bottom-24 right-4 z-[90] flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden sm:right-6"
        >
          <header className="flex items-center justify-between border-b border-mist-200/70 bg-white/60 px-4 py-3">
            <div>
              <p className="font-display text-sm font-bold text-ink-900">{SITE_NAME} AI</p>
              <p className="text-[11px] text-ink-800/50">Asisten seputar {SITE_NAME}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup chat"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-800/60 hover:bg-mist-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="rounded-2xl bg-mist-100 px-4 py-3 text-sm text-ink-800/80">
                Halo! 👋 Aku {SITE_NAME} AI. Tanya apa saja seputar cara pakai {SITE_NAME}, atau
                langsung tempel link TikTok/Instagram/YouTube di sini biar aku bantu ambilkan
                videonya.
              </div>
            )}

            {messages.map((msg) => {
              if (msg.role === 'system') {
                return (
                  <p key={msg.id} role="alert" className="text-center text-xs text-red-600">
                    {msg.content}
                  </p>
                );
              }
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${isUser ? '' : 'w-full'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-brand-600 text-white'
                          : 'bg-white/80 text-ink-900 border border-mist-200'
                      }`}
                    >
                      <InlineMarkdown text={msg.content} />
                    </div>
                    {msg.download && (
                      <div className="mt-2">
                        <ResultCard result={msg.download} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl border border-mist-200 bg-white/80 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-mist-200/70 bg-white/60 p-3">
            <div className="flex items-center gap-2">
              <label htmlFor="chat-input" className="sr-only">
                Tulis pesan
              </label>
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder="Tanya soal SaveNest atau kirim link video..."
                autoComplete="off"
                disabled={isLoading}
                className="flex-1 rounded-xl border border-mist-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-800/40 focus:border-brand-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Kirim pesan"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M4 12h16m0 0-6-6m6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-ink-800/40">
              Setiap pesan menggunakan kuota harian yang sama dengan tombol Download.
            </p>
            {/* Usually renders nothing visible — see README's Cloudflare Turnstile section. */}
            <div ref={turnstile.containerRef} />
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? `Tutup ${SITE_NAME} AI` : `Buka ${SITE_NAME} AI`}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-glass-lg transition-transform hover:-translate-y-0.5 sm:right-6"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path
              d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.35 0-2.61-.32-3.71-.9L4 20l1.1-4.24A8.46 8.46 0 0 1 3.5 11.5a8.5 8.5 0 0 1 17 0Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </>
  );
}

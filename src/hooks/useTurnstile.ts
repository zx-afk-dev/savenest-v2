import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Renders a Cloudflare Turnstile widget into a hidden container and exposes
 * the resulting verification token. Whether this is ever visible to the
 * person at all depends on the widget mode chosen when the site key was
 * created in the Cloudflare dashboard:
 *
 * - "Managed" (Cloudflare's recommended default): usually resolves silently
 *   in the background with nothing shown; only rarely escalates to a small
 *   interactive check for traffic that already looks risky.
 * - "Invisible": never shows anything, ever.
 * - "Non-interactive": always shows a small non-clickable badge, but never
 *   requires a tap.
 *
 * See README's Cloudflare Turnstile section for how to pick one. This hook
 * behaves the same regardless of which mode the key uses — it just renders
 * the widget and waits for a token.
 *
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set, this is a no-op (`enabled`
 * stays false) and callers should skip attaching a token entirely.
 */
export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;

    let cancelled = false;

    function render() {
      if (cancelled || !containerRef.current) return;
      if (!window.turnstile) {
        // The challenges.cloudflare.com script (loaded via next/script in
        // _app.tsx) may not have finished loading yet — poll briefly.
        setTimeout(render, 150);
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(null),
        'error-callback': () => setToken(null),
      });
    }

    render();
    return () => {
      cancelled = true;
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
    };
  }, []);

  function reset() {
    if (widgetIdRef.current) {
      window.turnstile?.reset(widgetIdRef.current);
      setToken(null);
    }
  }

  return { containerRef, token, enabled: Boolean(SITE_KEY), reset };
}

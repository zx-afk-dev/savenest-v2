import { useEffect, useMemo, useState } from 'react';
import { LOADING_MESSAGES } from '@/lib/constants';
import type { SupportedPlatform } from '@/types';

interface Props {
  platform: SupportedPlatform | null;
}

const PLATFORM_INITIAL: Record<SupportedPlatform, string> = {
  tiktok: 'TT',
  instagram: 'IG',
  youtube: 'YT',
};

/**
 * A courier + package + server-building loading scene, built entirely from
 * CSS transforms/keyframes (see tailwind.config.js: `walk`, `bob`,
 * `pulse-ring`, `float`). CSS-transform animations are compositor-driven, so
 * this stays smooth well above 60 FPS without touching layout — no canvas
 * render loop or Lottie runtime needed. If real Lottie art is later
 * produced, it's a drop-in swap: replace <CourierScene /> with
 * `<Lottie animationData={...} />` from `lottie-react` and keep the rest of
 * this overlay (progress bar, rotating captions, a11y wiring) unchanged.
 */
export function DownloadLoadingOverlay({ platform }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);

    // Progress is a perceptual illusion (the real work happens server-side)
    // — it eases toward ~92% and holds, then the parent unmounts this
    // overlay once the real response arrives.
    const progressTimer = setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + (92 - p) * 0.12 + 1));
    }, 220);

    return () => {
      clearInterval(messageTimer);
      clearInterval(progressTimer);
    };
  }, []);

  const badge = useMemo(() => (platform ? PLATFORM_INITIAL[platform] : '↓'), [platform]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-mist-50/95 backdrop-blur-md"
    >
      <div className="glass-panel-strong relative w-full max-w-lg overflow-hidden px-8 py-10">
        {/* Scene */}
        <div className="relative mb-8 h-32 overflow-hidden rounded-2xl bg-gradient-to-b from-brand-50 to-white">
          {/* ground line */}
          <div className="absolute bottom-6 left-0 right-0 h-px bg-brand-200" />

          {/* Destination: server / cloud building */}
          <div className="absolute bottom-6 right-6 flex flex-col items-center">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-glass-lg">
              <span className="absolute inset-0 rounded-2xl border-2 border-brand-400 animate-pulse-ring" />
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" aria-hidden="true">
                <path
                  d="M4 15a4 4 0 0 1 1.2-7.8A5 5 0 0 1 15 6a4.5 4.5 0 0 1 1 8.9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 15v3m3-3v4m3-4v2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
              SaveNest Cloud
            </span>
          </div>

          {/* Courier walking across the scene */}
          <div className="absolute bottom-6 left-4 animate-walk motion-reduce:animate-none">
            <CourierScene badge={badge} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-mist-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-4 text-center font-display text-base font-semibold text-ink-900">
          {LOADING_MESSAGES[messageIndex]}
        </p>
        <p className="mt-1 text-center text-xs text-ink-800/60">Jangan tutup halaman ini.</p>
      </div>
    </div>
  );
}

function CourierScene({ badge }: { badge: string }) {
  return (
    <div className="relative h-16 w-16 animate-bob motion-reduce:animate-none">
      {/* Package (carried above the head, platform badge on the box) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-float motion-reduce:animate-none">
        <div className="flex h-6 w-7 items-center justify-center rounded-md border-2 border-brand-700 bg-mist-100 text-[9px] font-bold text-brand-700 shadow-sm">
          {badge}
        </div>
      </div>

      {/* Body (blocky / pixel-chibi style via crisp-edged rounded rects) */}
      <svg viewBox="0 0 40 40" className="h-16 w-16" aria-hidden="true">
        {/* cap */}
        <rect x="12" y="4" width="16" height="6" rx="1" fill="#0f172a" />
        {/* head */}
        <rect x="13" y="10" width="14" height="10" rx="2" fill="#fbcfa0" />
        {/* eyes */}
        <rect x="17" y="14" width="2" height="2" fill="#0f172a" />
        <rect x="22" y="14" width="2" height="2" fill="#0f172a" />
        {/* body / uniform */}
        <rect x="11" y="20" width="18" height="12" rx="3" fill="#2563eb" />
        <rect x="16" y="20" width="8" height="12" fill="#1d4ed8" opacity="0.4" />
        {/* legs — two alternating pairs create the marching illusion */}
        <g className="origin-top animate-[walk-leg-a_0.6s_steps(2,jump-none)_infinite] motion-reduce:animate-none">
          <rect x="13" y="32" width="5" height="7" rx="1.5" fill="#0f172a" />
        </g>
        <g className="origin-top animate-[walk-leg-b_0.6s_steps(2,jump-none)_infinite] motion-reduce:animate-none">
          <rect x="22" y="32" width="5" height="7" rx="1.5" fill="#1e293b" />
        </g>
      </svg>
    </div>
  );
}

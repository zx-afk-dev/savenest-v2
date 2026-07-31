import { useEffect, useMemo, useState } from 'react';
import { LOADING_MESSAGES } from '@/lib/constants';
import type { SupportedPlatform } from '@/types';
import { Cuboid } from '@/components/loading/Cuboid';

interface Props {
  platform: SupportedPlatform | null;
}

const PLATFORM_INITIAL: Record<SupportedPlatform, string> = {
  tiktok: 'TT',
  instagram: 'IG',
  youtube: 'YT',
};

/**
 * A 3D voxel courier walking a package to a "SaveNest Cloud" block, built
 * entirely from CSS `perspective` + `transform-style: preserve-3d` +
 * `Cuboid` primitives (see Cuboid.tsx) — no WebGL, no canvas render loop,
 * no extra dependency. Everything animates via CSS transforms/keyframes
 * (compositor-driven), so it stays smooth well above 60 FPS even with ~50
 * small face elements on screen. If real hand-crafted 3D/Lottie art is ever
 * produced instead, this whole scene can be swapped out and the rest of the
 * overlay (progress bar, rotating captions, a11y wiring) is unchanged.
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
        {/* 3D scene */}
        <div
          className="relative mb-8 h-40 overflow-hidden rounded-2xl bg-gradient-to-b from-brand-50 to-white"
          style={{ perspective: 700 }}
        >
          {/* ground line */}
          <div className="absolute bottom-10 left-0 right-0 h-px bg-brand-200" />
          <div className="absolute bottom-10 left-0 right-0 h-10 bg-gradient-to-b from-brand-100/40 to-transparent" />

          {/* Destination: 3D server block */}
          <div
            className="absolute bottom-10 right-8"
            style={{ transformStyle: 'preserve-3d', transform: 'rotateX(8deg) rotateY(-18deg)' }}
          >
            <span className="absolute -inset-2 rounded-2xl border-2 border-brand-400 animate-pulse-ring" />
            <Cuboid
              width={46}
              height={46}
              depth={40}
              color="#2563eb"
              style={{ position: 'relative' }}
              frontContent={
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" aria-hidden="true">
                  <path
                    d="M4 15a4 4 0 0 1 1.2-7.8A5 5 0 0 1 15 6a4.5 4.5 0 0 1 1 8.9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-brand-700">
              SaveNest Cloud
            </span>
          </div>

          {/* Courier walking across the scene */}
          <div className="absolute bottom-10 left-6 animate-walk motion-reduce:animate-none">
            <VoxelCourier badge={badge} />
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

function VoxelCourier({ badge }: { badge: string }) {
  return (
    <div
      className="relative h-24 w-20 animate-bob motion-reduce:animate-none"
      style={{ perspective: 400 }}
    >
      <div
        className="absolute bottom-0 left-1/2"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'translateX(-50%) rotateX(6deg) rotateY(-24deg)',
        }}
      >
        {/* Package — carried up front, bobbing independently, badge on its face */}
        <div
          className="absolute animate-float motion-reduce:animate-none"
          style={{ top: -58, left: -6, transformStyle: 'preserve-3d' }}
        >
          <Cuboid
            width={16}
            height={13}
            depth={13}
            color="#eff6ff"
            style={{ position: 'relative' }}
            frontContent={<span className="text-[8px] font-extrabold text-brand-700">{badge}</span>}
          />
        </div>

        {/* Cap */}
        <div style={{ position: 'absolute', top: -46, left: -8, transformStyle: 'preserve-3d' }}>
          <Cuboid width={17} height={6} depth={16} color="#0f172a" style={{ position: 'relative' }} />
        </div>

        {/* Head */}
        <div style={{ position: 'absolute', top: -40, left: -7.5, transformStyle: 'preserve-3d' }}>
          <Cuboid width={15} height={13} depth={13} color="#fbcfa0" style={{ position: 'relative' }} />
        </div>

        {/* Torso */}
        <div style={{ position: 'absolute', top: -27, left: -10, transformStyle: 'preserve-3d' }}>
          <Cuboid width={20} height={16} depth={11} color="#2563eb" style={{ position: 'relative' }} />
        </div>

        {/* Arms — pivot at shoulder, swing via CSS keyframes (see globals.css) */}
        <div
          className="origin-top motion-reduce:animate-none"
          style={{
            position: 'absolute',
            top: -26,
            left: -14,
            transformStyle: 'preserve-3d',
            animation: 'arm-swing 0.6s ease-in-out infinite',
          }}
        >
          <Cuboid width={5} height={13} depth={5} color="#1d4ed8" style={{ position: 'relative', top: 6 }} />
        </div>
        <div
          className="origin-top motion-reduce:animate-none"
          style={{
            position: 'absolute',
            top: -26,
            left: 9,
            transformStyle: 'preserve-3d',
            animation: 'arm-swing 0.6s ease-in-out infinite',
            animationDelay: '-0.3s',
          }}
        >
          <Cuboid width={5} height={13} depth={5} color="#1d4ed8" style={{ position: 'relative', top: 6 }} />
        </div>

        {/* Legs — pivot at hip, swing via CSS keyframes, offset in phase from each other */}
        <div
          className="origin-top motion-reduce:animate-none"
          style={{
            position: 'absolute',
            top: -11,
            left: -8,
            transformStyle: 'preserve-3d',
            animation: 'leg-swing 0.6s ease-in-out infinite',
          }}
        >
          <Cuboid width={6.5} height={14} depth={6.5} color="#1e293b" style={{ position: 'relative', top: 7 }} />
        </div>
        <div
          className="origin-top motion-reduce:animate-none"
          style={{
            position: 'absolute',
            top: -11,
            left: 1.5,
            transformStyle: 'preserve-3d',
            animation: 'leg-swing 0.6s ease-in-out infinite',
            animationDelay: '-0.3s',
          }}
        >
          <Cuboid width={6.5} height={14} depth={6.5} color="#334155" style={{ position: 'relative', top: 7 }} />
        </div>
      </div>
    </div>
  );
}

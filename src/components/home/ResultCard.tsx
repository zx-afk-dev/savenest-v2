import { useState } from 'react';
import Image from 'next/image';
import type { DownloadResult, MediaOption, SupportedPlatform } from '@/types';

const PLATFORM_LABEL: Record<SupportedPlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

function formatDuration(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface ResultCardProps {
  result: DownloadResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const duration = formatDuration(result.durationSeconds);

  return (
    <div className="glass-panel-strong animate-fade-up p-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-mist-200 sm:h-32 sm:w-32">
          {result.thumbnail ? (
            <Image
              src={result.thumbnail}
              alt={result.title}
              fill
              sizes="128px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-800/30">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="m3 15 5-5 4 4 4-4 5 5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-600/10 px-3 py-1 text-xs font-semibold text-brand-700">
              {PLATFORM_LABEL[result.platform]}
            </span>
            {duration && (
              <span className="rounded-full bg-mist-200 px-3 py-1 text-xs font-medium text-ink-800/70">
                {duration}
              </span>
            )}
            {result.cached && (
              <span className="rounded-full bg-mist-200 px-3 py-1 text-xs font-medium text-ink-800/70">
                Dari cache
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 font-display text-base font-bold text-ink-900 sm:text-lg">
            {result.title}
          </h3>
          {result.author && (
            <p className="mt-1 truncate text-sm text-ink-800/60">oleh {result.author}</p>
          )}
        </div>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {result.media.map((item) => (
          <MediaOptionRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function MediaOptionRow({ item }: { item: MediaOption }) {
  const [copied, setCopied] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail without permission — fail silently, the link
      // is still available via Download/Preview.
    }
  }

  return (
    <li className="rounded-2xl border border-mist-200 bg-white/70 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{item.label}</p>
          <p className="text-xs text-ink-800/50">
            {[item.format ?? (item.kind === 'audio' ? 'MP3' : 'MP4'), item.sizeLabel]
              .filter(Boolean)
              .join(' · ')}
            {item.noWatermark ? ' · Tanpa watermark' : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-mist-100 px-2 py-1 text-[10px] font-bold uppercase text-ink-800/50">
          {item.kind}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={item.url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl bg-brand-600 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Download
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl border border-mist-200 bg-white px-3 py-2 text-xs font-semibold text-ink-800 transition-colors hover:border-brand-200"
        >
          {copied ? 'Tersalin!' : 'Copy Link'}
        </button>
        <button
          type="button"
          onClick={() => setPreviewing((v) => !v)}
          className="rounded-xl border border-mist-200 bg-white px-3 py-2 text-xs font-semibold text-ink-800 transition-colors hover:border-brand-200"
          aria-expanded={previewing}
        >
          {previewing ? 'Tutup' : 'Preview'}
        </button>
      </div>

      {previewing && (
        <div className="mt-3 overflow-hidden rounded-xl bg-black">
          {item.kind === 'audio' ? (
            <audio controls className="w-full" src={item.url} />
          ) : (
            <video controls className="max-h-64 w-full" src={item.url} />
          )}
        </div>
      )}
    </li>
  );
}

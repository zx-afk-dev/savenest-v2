import { REQUEST_TIMEOUT_MS } from '@/lib/constants';
import type { DownloadResult, MediaOption, SupportedPlatform } from '@/types';

const API_BASE_URL = process.env.DOWNLOAD_API_BASE_URL ?? 'https://api.blckrose.my.id/download/aio';
const API_KEY = process.env.DOWNLOAD_API_KEY ?? 'RidfM';

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly kind: 'TIMEOUT' | 'HTTP' | 'PARSE' | 'UNKNOWN' = 'UNKNOWN',
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

/**
 * Shape of what the aio endpoint actually returns, confirmed against a real
 * response for a TikTok URL:
 *
 *   {
 *     "creator": "Blckrosé",              // API branding — NOT the video author, never use this as `author`
 *     "status": true,
 *     "result": {
 *       "title": "...",
 *       "thumbnail": "https://...",
 *       "duration": 15,
 *       "source": "https://www.tiktok.com/...",
 *       "platform": "tiktok",
 *       "medias": [
 *         { "url": "...", "quality": "hd_no_watermark", "ext": "mp4", "type": "video", "size": "0.33 MB" },
 *         { "url": "...", "quality": "no_watermark",    "ext": "mp4", "type": "video", "size": "0.67 MB" },
 *         { "url": "...", "quality": "audio",           "ext": "mp3", "type": "audio", "size": "-" }
 *       ]
 *     }
 *   }
 *
 * Instagram/YouTube responses from the same API haven't been observed
 * directly, so `RawResultShape`/`RawMediaItem` still keep a few defensive
 * alternate field names (`media`, `link`/`play`/`download`, `desc`/`caption`,
 * `cover`/`image`) as a safety net. If a live response for those platforms
 * turns out to differ, this function is the only place that needs updating.
 */
interface RawUpstreamPayload {
  creator?: string; // API/branding name — deliberately never mapped to author
  status?: boolean | string | number;
  success?: boolean;
  message?: string;
  result?: RawResultShape;
  data?: RawResultShape;
  [key: string]: unknown;
}

interface RawResultShape {
  title?: string;
  desc?: string;
  caption?: string;
  author?: string | { name?: string; username?: string };
  username?: string;
  thumbnail?: string;
  cover?: string;
  image?: string;
  duration?: number;
  source?: string;
  platform?: string;
  medias?: RawMediaItem[];
  media?: RawMediaItem[]; // defensive alt key, in case another platform uses the singular form
  [key: string]: unknown;
}

interface RawMediaItem {
  url?: string;
  link?: string;
  play?: string;
  download?: string;
  /** e.g. "hd_no_watermark", "no_watermark", "audio", "sd", "720p" */
  quality?: string;
  /** e.g. "mp4", "mp3" */
  ext?: string;
  /** "video" | "audio" | "image" */
  type?: string;
  /** Human-readable, e.g. "0.33 MB" — or "-" when unknown */
  size?: string | number;
  label?: string;
}

const PLATFORM_ALIASES: Record<string, SupportedPlatform> = {
  tiktok: 'tiktok',
  instagram: 'instagram',
  ig: 'instagram',
  youtube: 'youtube',
  yt: 'youtube',
};

function detectPlatformFromUrl(url: string): SupportedPlatform {
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/instagram\.com/i.test(url)) return 'instagram';
  return 'youtube';
}

function resolvePlatform(rawPlatform: string | undefined, fallbackUrl: string): SupportedPlatform {
  if (rawPlatform) {
    const normalized = PLATFORM_ALIASES[rawPlatform.trim().toLowerCase()];
    if (normalized) return normalized;
  }
  return detectPlatformFromUrl(fallbackUrl);
}

function mediaKindFrom(type: string | undefined): MediaOption['kind'] {
  const t = (type ?? '').toLowerCase();
  if (t === 'audio') return 'audio';
  if (t === 'image') return 'image';
  return 'video';
}

/** Turns an API quality slug like "hd_no_watermark" into a friendly label. */
function labelForMedia(item: RawMediaItem, kind: MediaOption['kind'], index: number): string {
  const q = (item.quality ?? '').toLowerCase();

  if (kind === 'audio' || q.includes('audio')) {
    return `Audio ${item.ext ? item.ext.toUpperCase() : 'MP3'}`;
  }
  if (q.includes('hd') && q.includes('no_watermark')) return 'HD No Watermark';
  if (q.includes('no_watermark')) return 'No Watermark';
  if (q.includes('watermark')) return 'Watermark';
  if (q.includes('hd')) return 'HD';
  if (q.includes('sd')) return 'SD';
  if (item.label) return item.label;
  if (q) return q.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return kind === 'video' ? `Video ${index + 1}` : `Media ${index + 1}`;
}

function sizeLabelFrom(size: string | number | undefined): string | undefined {
  if (size === undefined) return undefined;
  if (typeof size === 'number') return `${size} B`;
  const trimmed = size.trim();
  if (!trimmed || trimmed === '-') return undefined;
  return trimmed;
}

function normalizeUpstreamPayload(sourceUrl: string, payload: RawUpstreamPayload): DownloadResult {
  const result = payload.result ?? payload.data ?? {};
  const platform = resolvePlatform(result.platform, result.source ?? sourceUrl);

  const author =
    typeof result.author === 'string'
      ? result.author
      : (result.author?.name ?? result.author?.username ?? result.username);

  const rawMediaList = result.medias ?? result.media ?? [];

  const media: MediaOption[] = rawMediaList
    .map((item, index): MediaOption | null => {
      const url = item.url ?? item.link ?? item.play ?? item.download;
      if (!url) return null;
      const kind = mediaKindFrom(item.type);
      const qualitySlug = (item.quality ?? '').toLowerCase();

      return {
        id: `${kind}-${index}`,
        label: labelForMedia(item, kind, index),
        kind,
        url,
        format: item.ext ? item.ext.toUpperCase() : undefined,
        sizeLabel: sizeLabelFrom(item.size),
        noWatermark: qualitySlug.includes('no_watermark'),
      };
    })
    .filter((m): m is MediaOption => m !== null);

  // De-duplicate by resolved URL in case the API ever repeats an entry.
  const seen = new Set<string>();
  const dedupedMedia = media.filter((m) => {
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });

  return {
    platform,
    sourceUrl: result.source ?? sourceUrl,
    title: result.title ?? result.desc ?? result.caption ?? 'Video tanpa judul',
    author,
    thumbnail: result.thumbnail ?? result.cover ?? result.image,
    durationSeconds: result.duration,
    media: dedupedMedia,
    cached: false,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Calls the upstream all-in-one downloader API and normalizes its response.
 * This is the ONLY place in the codebase allowed to know about
 * `DOWNLOAD_API_BASE_URL` / `DOWNLOAD_API_KEY` — never import this from
 * client-side code.
 */
export async function fetchFromUpstream(sourceUrl: string): Promise<DownloadResult> {
  const endpoint = new URL(API_BASE_URL);
  endpoint.searchParams.set('url', sourceUrl);
  endpoint.searchParams.set('apikey', API_KEY);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new UpstreamError(`Upstream responded with status ${response.status}`, 'HTTP');
    }

    let payload: RawUpstreamPayload;
    try {
      payload = (await response.json()) as RawUpstreamPayload;
    } catch {
      throw new UpstreamError('Upstream returned a non-JSON response', 'PARSE');
    }

    if (payload.success === false || payload.status === false || payload.status === 'error') {
      throw new UpstreamError(payload.message ?? 'Upstream reported failure for this URL', 'HTTP');
    }

    const normalized = normalizeUpstreamPayload(sourceUrl, payload);
    if (normalized.media.length === 0) {
      throw new UpstreamError('Upstream returned no downloadable media for this URL', 'PARSE');
    }
    return normalized;
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new UpstreamError('Upstream request timed out', 'TIMEOUT');
    }
    throw new UpstreamError('Unexpected error calling upstream API', 'UNKNOWN');
  } finally {
    clearTimeout(timeout);
  }
}

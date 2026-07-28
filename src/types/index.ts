// ---------------------------------------------------------------------------
// Domain types shared across the frontend, API routes, and lib/ utilities.
// ---------------------------------------------------------------------------

export type SupportedPlatform = 'tiktok' | 'instagram' | 'youtube';

export interface MediaOption {
  /** Stable id so the UI can key list items */
  id: string;
  /** Human label shown on the button, e.g. "HD No Watermark" */
  label: string;
  /** "video" | "audio" | "image" */
  kind: 'video' | 'audio' | 'image';
  /** Direct, ready-to-download URL as returned by the upstream API */
  url: string;
  /** File format hint shown to the user, e.g. "MP4", "MP3" */
  format?: string;
  /** Human-readable size as returned by the upstream API, e.g. "0.33 MB" */
  sizeLabel?: string;
  /** True when the file has no platform watermark burned in */
  noWatermark?: boolean;
}

export interface DownloadResult {
  platform: SupportedPlatform;
  sourceUrl: string;
  title: string;
  author?: string;
  thumbnail?: string;
  durationSeconds?: number;
  media: MediaOption[];
  cached: boolean;
  fetchedAt: string; // ISO timestamp
}

export interface ApiErrorShape {
  success: false;
  code: DownloadErrorCode;
  message: string;
}

export interface ApiSuccessShape {
  success: true;
  data: DownloadResult;
}

export type DownloadApiResponse = ApiSuccessShape | ApiErrorShape;

export type DownloadErrorCode =
  | 'INVALID_URL'
  | 'UNSUPPORTED_PLATFORM'
  | 'RATE_LIMITED'
  | 'GLOBAL_QUOTA_EXCEEDED'
  | 'ORIGIN_NOT_ALLOWED'
  | 'BOT_DETECTED'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_TIMEOUT'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_ERROR';

export interface GlobalStats {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string; // ISO timestamp of next 00:00 WIB
}

export interface GlobalStatsApiResponse {
  success: true;
  data: GlobalStats;
}

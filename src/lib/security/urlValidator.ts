import type { SupportedPlatform } from '@/types';

const PLATFORM_PATTERNS: Record<SupportedPlatform, RegExp[]> = {
  tiktok: [
    /^https?:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com\/.+$/i,
    /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w-]+\/?$/i,
  ],
  instagram: [/^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv|stories)\/[\w-]+\/?.*$/i],
  youtube: [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+.*$/i,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+.*$/i,
    /^https?:\/\/youtu\.be\/[\w-]+.*$/i,
  ],
};

export interface UrlValidationResult {
  valid: boolean;
  platform?: SupportedPlatform;
  normalizedUrl?: string;
  reason?: string;
}

/**
 * Validates that a raw string is a well-formed http(s) URL belonging to one of
 * the supported platforms. Never throws — always returns a result object so
 * callers can render a friendly error instead of a stack trace.
 */
export function validateSupportedUrl(raw: string): UrlValidationResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { valid: false, reason: 'URL tidak boleh kosong.' };
  }

  if (trimmed.length > 2048) {
    return { valid: false, reason: 'URL terlalu panjang.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'Format URL tidak valid.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, reason: 'Hanya URL http/https yang diizinkan.' };
  }

  // Block obvious SSRF / local-network targets before we ever forward this
  // string to the upstream API or a fetch() call.
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (
    blockedHosts.includes(parsed.hostname) ||
    parsed.hostname.startsWith('192.168.') ||
    parsed.hostname.startsWith('10.') ||
    parsed.hostname.endsWith('.local')
  ) {
    return { valid: false, reason: 'URL tidak diizinkan.' };
  }

  for (const platform of Object.keys(PLATFORM_PATTERNS) as SupportedPlatform[]) {
    const patterns = PLATFORM_PATTERNS[platform];
    if (patterns.some((pattern) => pattern.test(trimmed))) {
      return { valid: true, platform, normalizedUrl: trimmed };
    }
  }

  return {
    valid: false,
    reason: 'URL harus dari TikTok, Instagram, atau YouTube.',
  };
}

/** Strips control characters and trims whitespace from freeform user input. */
export function sanitizeInput(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

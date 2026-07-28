export const SITE_NAME = 'SaveNest';
export const SITE_TAGLINE = 'Save everything, nest it safely.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://savenest.web.id';
export const SITE_DOMAIN = 'savenest.web.id';

export const BRAND_COLOR = '#2563eb';

export const SUPPORTED_PLATFORMS = ['tiktok', 'instagram', 'youtube'] as const;

export const GLOBAL_DAILY_LIMIT = Number(process.env.GLOBAL_DAILY_LIMIT ?? 60);
// Asia/Jakarta (WIB) is UTC+7 and does not observe DST.
export const QUOTA_TIMEZONE_OFFSET_MINUTES = Number(
  process.env.QUOTA_TIMEZONE_OFFSET_MINUTES ?? 420,
);

export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS ?? 600);

export const IP_RATE_LIMIT_MAX = Number(process.env.IP_RATE_LIMIT_MAX ?? 10);
export const IP_RATE_LIMIT_WINDOW_SECONDS = Number(
  process.env.IP_RATE_LIMIT_WINDOW_SECONDS ?? 60,
);
export const IP_COOLDOWN_SECONDS = Number(process.env.IP_COOLDOWN_SECONDS ?? 5);

export const REQUEST_TIMEOUT_MS = 15_000;

export const LOADING_MESSAGES = [
  'Mengambil video...',
  'Lagi ambil data...',
  'Sebentar ya...',
  'Lagi kirim paket ke server...',
] as const;

export const NAV_LINKS = [
  { href: '/', label: 'Downloader' },
  { href: '/about', label: 'Tentang' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Kontak' },
] as const;

export const FOOTER_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/dmca', label: 'DMCA' },
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/tqto', label: 'Thanks To' },
  { href: '/contact', label: 'Contact' },
] as const;

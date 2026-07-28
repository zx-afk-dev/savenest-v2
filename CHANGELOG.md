# Changelog

All notable changes to SaveNest are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-07-28

### Added

- Initial release of SaveNest.
- Downloader for TikTok, Instagram, and YouTube backed by `api.blckrose.my.id/download/aio`.
- Full internal API security pipeline: URL validation, IP rate limiting, cooldown, duplicate
  in-flight detection, origin/referer/header validation, bot heuristics, CORS, CSP and other
  security headers.
- Global shared daily quota (default 60/day, resets 00:00 WIB) backed by Netlify Blobs, with a
  local-file fallback for development.
- 10-minute response cache keyed by source URL, backed by Netlify Blobs.
- Fullscreen CSS-driven loading animation (pixel-chibi courier walking a package to a
  "SaveNest Cloud" building).
- Result view with per-media Download / Copy Link / Preview actions.
- Static pages: About, FAQ, Terms, Privacy, Contact, DMCA, Disclaimer, Thanks To.
- Full SEO: meta tags, Open Graph, Twitter Card, canonical URLs, JSON-LD (Organization, WebSite,
  SoftwareApplication, FAQPage, BreadcrumbList), dynamic sitemap.xml and robots.txt.
- PWA support: manifest, service worker with offline fallback page, generated icon set.
- Accessibility: skip link, visible focus rings, ARIA labeling, AA color contrast, full keyboard
  navigation.

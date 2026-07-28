# SaveNest

Downloader video modern untuk **TikTok**, **Instagram**, dan **YouTube** — tempel URL, klik
Download, selesai. Dibangun dengan Next.js (Pages Router) + TypeScript + Tailwind CSS, tanpa
database, siap deploy ke Netlify.

> Live target domain: `savenest.web.id`

---

## ✨ Fitur Utama

- Validasi URL untuk TikTok, Instagram, dan YouTube di sisi client & server.
- Satu sumber data: seluruh hasil download berasal dari API `api.blckrose.my.id/download/aio` —
  SaveNest **tidak** melakukan scraping sendiri.
- Animasi loading fullscreen (kurir chibi membawa paket ke "SaveNest Cloud") berbasis CSS
  transform, halus di 60 FPS+ tanpa canvas render-loop.
- Kuota harian global (default 60 request/hari, reset 00:00 WIB) dibagikan oleh **semua**
  pengguna, bukan per-user — lihat [catatan Netlify Blobs](#kuota-global--tanpa-database) di bawah.
- Cache respons per-URL selama 10 menit.
- Lapisan keamanan berlapis di `/api/download` (lihat [tabel di bawah](#lapisan-keamanan)).
- SEO lengkap: meta tags, Open Graph, Twitter Card, JSON-LD (Organization, WebSite,
  SoftwareApplication, FAQPage, BreadcrumbList), sitemap & robots dinamis.
- PWA: manifest, service worker dengan halaman offline, icon set lengkap (dihasilkan secara
  programatik — lihat `scripts/generate-icons.py`).
- Aksesibilitas: skip-link, fokus ring, ARIA label, kontras warna AA, navigasi keyboard penuh.

---

## 🚀 Menjalankan Secara Lokal

```bash
npm install
cp .env.example .env
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Tidak perlu setup database atau service
eksternal apa pun untuk development — lihat catatan penyimpanan di bawah untuk detail fallback
lokal.

Perintah lain yang tersedia:

```bash
npm run build        # production build
npm run start         # jalankan hasil build
npm run lint          # ESLint
npm run type-check    # tsc --noEmit (strict mode)
npm run format        # Prettier (termasuk urutan class Tailwind)
```

---

## ☁️ Deploy ke Netlify

1. Push repo ini ke GitHub/GitLab/Bitbucket.
2. Di Netlify: **Add new site → Import an existing project**, pilih repo ini.
3. Build command & publish directory sudah dikonfigurasi lewat `netlify.toml`
   (`npm run build` → `.next`, memakai plugin resmi `@netlify/plugin-nextjs`).
4. Tambahkan environment variables di **Site settings → Environment variables** sesuai
   `.env.example` (minimal: `NEXT_PUBLIC_SITE_URL`, `DOWNLOAD_API_BASE_URL`, `DOWNLOAD_API_KEY`).
5. **Aktifkan Netlify Blobs** untuk site kamu (biasanya otomatis tersedia di site baru — cek tab
   **Blobs** di dashboard). Ini wajib agar kuota global & cache berfungsi di production.
6. Deploy. Tidak ada langkah manual tambahan.

---

## 🗄️ Kuota Global & Cache — Tanpa Database

Brief proyek ini secara eksplisit meminta **tanpa database**, tapi juga meminta kuota harian yang
**dibagikan oleh semua pengguna** dan cache 10 menit. Ini penting untuk dipahami:

> **Kenapa tidak pakai file `.json` biasa?** Netlify Functions (tempat API route Next.js berjalan
> setelah di-deploy) adalah lingkungan **serverless**: setiap invocation bisa berjalan di
> container yang berbeda dan terpisah, tidak ada disk lokal yang dibagikan antar-invocation/region,
> dan variabel in-memory hilang begitu function di-recycle. Sebuah "simpan hitungan ke file
> `.json` lokal" akan **terlihat berhasil** saat `next dev`, lalu diam-diam gagal/ke-reset acak di
> production — persis jenis solusi yang diperingatkan di brief.

**Solusi yang benar-benar dipakai:** [Netlify Blobs](https://docs.netlify.com/blobs/overview/),
sebuah key-value store gratis & zero-config yang tersedia untuk setiap Function/Edge Function di
site Netlify. Dipakai untuk dua hal:

- `src/lib/store/globalQuota.ts` — counter harian (`used`/`limit`/`resetsAt`), key di-namespace per
  tanggal WIB sehingga reset terjadi otomatis begitu hari berganti.
- `src/lib/cache/cacheStore.ts` — cache hasil per-URL dengan TTL 10 menit.

Keduanya diakses lewat abstraksi `src/lib/store/blobStore.ts`. Untuk **development lokal** (di
luar konteks Netlify), abstraksi ini otomatis fallback ke file JSON di `.data/` (di-gitignore) —
supaya `npm run dev` tetap jalan tanpa emulasi Netlify apa pun. Fallback ini **tidak pernah** dipakai
di production; deteksinya berdasarkan env var `NETLIFY` yang di-inject otomatis oleh platform.

**Batasan yang jujur perlu diketahui:** penambahan counter di `tryConsumeGlobalQuota()` bukan
atomic increment sejati (Netlify Blobs tidak punya operasi increment native). Di traffic tinggi
ada kemungkinan race condition kecil (dua request bersamaan bisa sama-sama lolos meski kuota
tersisa 1). Untuk limit 60/hari ini dianggap dapat diterima; jika butuh garansi lebih ketat,
ganti jadi compare-and-swap loop menggunakan ETag Netlify Blobs.

---

## 🛡️ Lapisan Keamanan

Semua permintaan download melewati satu pintu: `POST /api/download`. Frontend **tidak pernah**
memanggil `api.blckrose.my.id` secara langsung — API key upstream hanya hidup di environment
variable server (`DOWNLOAD_API_KEY`) dan dipakai di `src/lib/api/blckrose.ts`.

| Kebutuhan dari brief | Implementasi |
| --- | --- |
| Rate Limiter / IP Rate Limiter | `src/lib/security/ipRateLimiter.ts` — sliding window per-IP |
| Cooldown / Duplicate Request Detection / Queue-ish behavior | field `lastUrlHash` + `inFlight` di record yang sama |
| Request Validator / Header Validation | `src/lib/security/requestGuards.ts` → `validateHeaders` |
| Origin Validation / Referer Validation | `validateOriginAndReferer` |
| Bot Detection / User-Agent Validation | `detectBot` (heuristik UA + header `X-Requested-With`) |
| Debounce / Anti Auto-Click / Anti Flood | `useDebouncedCallback` di client (`src/hooks/useDebounce.ts`) sebelum request dikirim |
| Request Timeout / Abort Controller | `AbortController` + timeout 15s di `blckrose.ts` |
| Payload Validation / URL Validation / Input Sanitization | `zod` schema + `validateSupportedUrl` + `sanitizeInput` |
| CORS Protection | `corsHeadersFor()`, origin-scoped |
| Security Header / CSP / XSS / Clickjacking Protection | `next.config.js` → `headers()` (CSP, X-Frame-Options, dst.) |
| CSRF Protection | Validasi Origin/Referer + tidak ada auth berbasis cookie yang bisa disalahgunakan |
| No Open Redirect | Tidak ada endpoint redirect dinamis dari input user |
| Anti Script Injection | React escaping default + CSP + sanitisasi input |
| Global Limit | `globalQuota.ts` (lihat bagian di atas) |

Beberapa item di brief (mis. "Cloudflare Friendly", "Slowdown", "Queue Processing") bersifat lebih
ke arah *pola arsitektur* daripada modul terpisah — pola tersebut sudah tercermin lewat kombinasi
rate limiter + cooldown + timeout + validasi berlapis di atas, dan akan otomatis mendapat manfaat
tambahan dari proteksi bawaan Netlify/Cloudflare di depan (WAF, DDoS protection) jika diaktifkan di
level DNS/CDN.

---

## 🎬 Animasi Loading

`src/components/loading/DownloadLoadingOverlay.tsx` menampilkan kurir chibi bergaya pixel yang
berjalan membawa paket berlogo platform menuju "SaveNest Cloud", lalu progress bar & teks bergilir
("Mengambil video...", dst). Ini dibangun murni dari CSS `@keyframes`/transform (lihat
`tailwind.config.js` dan bagian akhir `src/styles/globals.css`) — animasi transform berjalan di
compositor thread browser sehingga tetap mulus jauh di atas 60 FPS tanpa render loop `<canvas>`.

Jika nanti kamu punya asset Lottie/pixel-art asli, komponen ini didesain untuk mudah diganti:
tinggal install `lottie-react` dan ganti `<CourierScene />` dengan `<Lottie animationData={...} />`
— progress bar, teks bergilir, dan wiring aksesibilitas (`role="status"`, `aria-live`) tidak perlu
diubah.

---

## 🗂️ Struktur Proyek

```
savenest/
├── public/                  # asset statis, manifest, service worker, icon
├── scripts/
│   └── generate-icons.py    # generator icon/OG image (Pillow, offline)
├── src/
│   ├── components/
│   │   ├── common/          # Button, GlassCard, Skeleton, ErrorBoundary
│   │   ├── home/             # Hero, DownloaderForm, ResultCard, FAQ, dst.
│   │   ├── layout/            # Header, Footer, Layout, SEO, PageShell
│   │   └── loading/           # DownloadLoadingOverlay
│   ├── hooks/                 # useDownloader, useGlobalStats, useDebounce
│   ├── lib/
│   │   ├── api/                # client upstream (blckrose.ts)
│   │   ├── cache/              # cache store (Netlify Blobs)
│   │   ├── security/           # validator URL, rate limiter, guards
│   │   ├── store/               # blobStore + globalQuota
│   │   ├── constants.ts
│   │   └── seo.ts
│   ├── pages/
│   │   ├── api/                 # download.ts, stats.ts
│   │   ├── index.tsx, about.tsx, faq.tsx, terms.tsx, privacy.tsx,
│   │   │   contact.tsx, dmca.tsx, disclaimer.tsx, tqto.tsx, 404.tsx
│   │   ├── sitemap.xml.tsx, robots.txt.tsx
│   │   └── _app.tsx, _document.tsx
│   ├── styles/globals.css
│   └── types/index.ts
├── netlify.toml
├── next.config.js
└── tailwind.config.js
```

---

## ⚠️ Catatan Jujur & Batasan

- **API pihak ketiga tidak resmi/tidak berdokumen publik.** `src/lib/api/blckrose.ts` menormalkan
  beberapa kemungkinan bentuk respons (`result`/`data`, `video`/`videos`, `no_watermark`, dst.).
  Jika struktur JSON asli API berbeda dari asumsi ini, sesuaikan hanya fungsi
  `normalizeUpstreamPayload` — tidak ada bagian lain yang perlu diubah.
- Kode ini **belum pernah dijalankan lewat `npm install` / `next build`** di lingkungan pembuatan
  proyek ini (tidak ada akses jaringan untuk mengunduh dependency). Struktur, tipe, dan import
  sudah ditulis dan ditinjau dengan cermat, tapi jalankan `npm run type-check` dan `npm run build`
  di komputer/CI yang punya akses internet sebelum deploy pertama untuk menangkap kesalahan kecil
  yang mungkin lolos. Bug yang muncul kemungkinan besar berupa hal remeh (import yang salah ketik,
  dst.), bukan kesalahan arsitektur.
- Icon & gambar OG dihasilkan secara programatik (`scripts/generate-icons.py`) sebagai placeholder
  bermerek yang layak pakai — ganti dengan aset desain final kapan pun kamu siap
  (`python3 scripts/generate-icons.py` untuk generate ulang setelah mengedit script).
- Rate limiter per-IP bersifat in-memory per instance Function (lihat komentar di
  `ipRateLimiter.ts`) — cukup untuk membendung abuse dari satu klien, tapi bukan pengganti kuota
  global (yang durable lewat Netlify Blobs).

---

## 📄 Lisensi

Lihat [LICENSE](./LICENSE). Konten yang diunduh pengguna tetap menjadi hak cipta pemiliknya
masing-masing — lihat [/dmca](./src/pages/dmca.tsx) dan [/disclaimer](./src/pages/disclaimer.tsx).

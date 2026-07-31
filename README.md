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
| Origin Validation / Referer Validation | `validateOriginAndReferer` — trusts whatever domain is actually serving the request (via Host header), so it works on any deployment URL without manual config |
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

Beberapa item di brief (mis. "Slowdown", "Queue Processing") bersifat lebih ke arah *pola
arsitektur* daripada modul terpisah — pola tersebut sudah tercermin lewat kombinasi rate limiter +
cooldown + timeout + validasi berlapis di atas. "Cloudflare Friendly" sekarang diimplementasikan
secara konkret lewat Cloudflare Turnstile — lihat bagian di bawah.

---

## 🤖🛡️ Cloudflare Turnstile (Opsional, Tanpa Bikin Pengguna Nunggu)

Lapisan anti-bot tambahan di atas semua yang sudah ada di tabel atas. **Sepenuhnya opt-in** — kalau
env var-nya tidak diisi, seluruh fitur ini nonaktif otomatis dan situs berjalan normal seperti
sebelumnya. Dipasang di form Download dan chat widget.

**Soal kekhawatiran "pengguna males nunggu/pencet centang" — ini yang perlu diketahui:**

Turnstile itu **bukan** reCAPTCHA versi lama yang selalu menampilkan kotak centang. ada 3 mode widget
yang dipilih saat bikin site key di dashboard Cloudflare:

| Mode | Yang dilihat pengguna |
| --- | --- |
| **Managed** (rekomendasi default Cloudflare) | Hampir selalu **tidak ada apa-apa** — verifikasi jalan diam-diam di background. Cloudflare sendiri melaporkan mayoritas besar pengunjung lolos tanpa interaksi sama sekali. Hanya trafik yang sudah terlihat mencurigakan yang sesekali diminta klik centang. |
| **Invisible** | **Tidak pernah** menampilkan apa pun, titik. Verifikasi 100% di background. |
| **Non-interactive** | Selalu muncul badge kecil (biar sesuai syarat branding Cloudflare), tapi tidak pernah perlu diklik. |

Untuk kekhawatiran kamu, pilih **Managed** (default, paling seimbang) atau **Invisible** (paling
"tak kelihatan") saat membuat site key — bukan sesuatu yang diatur lewat kode, tapi lewat dashboard
Cloudflare saat pembuatan key. Kode di proyek ini sudah kompatibel dengan mode mana pun, tidak perlu
diubah.

**Cara kerja teknisnya:** widget dirender ke elemen tersembunyi (lihat `useTurnstile.ts`) begitu
halaman dimuat, dan sudah menghasilkan token *sebelum* pengguna selesai mengetik/menempel URL —
jadi tidak ada delay tambahan yang terasa saat klik Download/Kirim. Token itu dikirim bareng request,
diverifikasi di server (`src/lib/security/turnstile.ts`) lewat endpoint resmi Cloudflare
`siteverify`. Kalau gagal terverifikasi, request ditolak dengan pesan yang jelas dan widget otomatis
di-reset supaya token baru siap untuk percobaan berikutnya.

**Setup:**

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → **Add site**.
2. Pilih widget mode **Managed** atau **Invisible** (lihat tabel di atas).
3. Copy **Site Key** → isi `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Copy **Secret Key** → isi
   `TURNSTILE_SECRET_KEY`. Kedua env var ini harus diisi bersamaan (kalau cuma satu yang diisi,
   fiturnya tidak akan berfungsi dengan benar).

**Alternatif lain kalau tidak mau widget sama sekali** (di luar cakupan kode proyek ini, diatur di
level DNS): arahkan DNS domain kamu lewat Cloudflare (gratis) dan aktifkan **Bot Fight Mode** —
proteksi di level jaringan, sepenuhnya transparan untuk pengguna asli, tanpa widget apa pun yang
perlu dipasang di kode. Ini lebih "berat" untuk disiapkan (perlu pindah nameserver) tapi cocok kalau
kamu ingin proteksi di depan Netlify tanpa sentuh kode sama sekali.

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

---

## 🤖 AI Support Chat

Widget chat mengambang (pojok kanan bawah, muncul di semua halaman) yang menjawab pertanyaan
seputar SaveNest saja, dan bisa langsung memproses link video yang dikirim di dalam chat. Ditenagai
oleh **Gemini API resmi** (Google AI Studio, free tier) — bukan API pihak ketiga tak resmi.

**Setup wajib:** ambil API key gratis di
[aistudio.google.com/apikey](https://aistudio.google.com/apikey) (tinggal masuk dengan akun Google,
tanpa kartu kredit), lalu isi `GEMINI_API_KEY` di `.env` (lokal) / environment variables Netlify
(production). Tanpa ini, chat akan merespons dengan pesan "fitur AI belum dikonfigurasi" — fitur
lain di situs tetap berjalan normal.

**Arsitektur:**

- `src/pages/api/chat.ts` — endpoint internal, melewati pipeline keamanan yang sama persis dengan
  `/api/download` (validasi header/origin/bot, rate limiter — bucket terpisah bernama `"chat"` lewat
  `src/lib/security/ipRateLimiter.ts` yang mendukung beberapa bucket independen).
- `src/lib/api/gemini.ts` — client server-only untuk Gemini `generateContent` API. API key hanya
  hidup di `GEMINI_API_KEY` (env var), tidak pernah dikirim ke browser. Model default
  `gemini-3.5-flash` (cepat & gratis), bisa diganti lewat `GEMINI_MODEL` kalau Google mengganti nama
  model tier gratisnya lagi di masa depan (ini cukup sering terjadi).
- `src/lib/ai/scopedPrompt.ts` — membangun instruksi pembatas topik yang dikirim lewat field
  **`systemInstruction`** asli milik Gemini — pemisahan peran system/user yang sungguhan dijamin oleh
  model, bukan sekadar digabung ke teks prompt seperti integrasi sebelumnya.
- **Stateless, tanpa `chatId`:** API Gemini tidak menyimpan riwayat percakapan di sisi mereka —
  setiap request harus menyertakan histori percakapan sendiri. `useChat.ts` menyimpan riwayat chat
  (dibatasi 20 pesan terakhir) di `localStorage` browser pengguna, dan mengirim ±8 giliran terakhir
  sebagai konteks di setiap request. Tidak ada database/akun di sisi kita — dan sebagai bonus,
  percakapan sekarang tetap ada meski halaman di-refresh (sebelumnya hilang).
- **Membantu download di dalam chat:** kalau pesan pengguna mengandung URL TikTok/Instagram/YouTube
  (`extractSupportedUrl` di `urlValidator.ts`), `api/chat.ts` memproses video itu lewat infrastruktur
  yang sama dengan tombol Download (cache 10 menit + `fetchFromUpstream`), lalu menyuntikkan hasilnya
  (judul, platform, daftar media) ke dalam `systemInstruction` sebagai konteks tambahan — supaya
  balasan Gemini akurat berdasarkan data asli, bukan mengarang. Hasil download itu juga dikirim balik
  ke frontend dan ditampilkan sebagai kartu hasil (tombol Download/Copy Link/Preview) langsung di
  dalam bubble chat.
- **Kuota global bersama:** setiap giliran chat (baik hanya tanya-jawab maupun yang memicu download)
  mengonsumsi 1 unit dari kuota harian 60/hari yang sama dengan tombol Download utama — chat tidak
  bisa dipakai untuk melewati batas harian.
- **Balasan yang diblokir filter keamanan Gemini** (mis. karena konten sensitif) ditangani secara
  halus — pengguna tetap mendapat balasan sopan di dalam chat ("maaf, aku tidak bisa membantu untuk
  itu..."), bukan pesan error yang menakutkan.

**Batas free tier:** berubah-ubah dari waktu ke waktu (biasanya berkisar puluhan request/menit dan
ratusan–ribuan/hari untuk model Flash) — cek dashboard [Google AI Studio](https://aistudio.google.com)
untuk angka terkini akun kamu. Kalau limit tercapai, chat akan merespons dengan pesan yang jelas
("batas pemakaian gratis tercapai") alih-alih error teknis.

---

## 🔍 Supaya Terdeteksi Stabil di Yahoo / Bing / DuckDuckGo

Penting untuk diketahui: **Yahoo Search sudah memakai indeks Bing sejak 2010** — tidak ada lagi
sistem webmaster/verifikasi terpisah khusus Yahoo. Begitu juga DuckDuckGo. Jadi satu langkah
verifikasi di **Bing Webmaster Tools** otomatis mencakup ketiganya (Yahoo, Bing, dan DuckDuckGo).
Situs/tutorial lama yang menyebut "submit ke Yahoo Site Explorer" sudah tidak berlaku lagi.

File-file yang sudah disiapkan di proyek ini untuk mendukung ini:

- **`/robots.txt`** dan **`/sitemap.xml`** — sudah dihasilkan otomatis oleh
  `src/pages/robots.txt.tsx` dan `src/pages/sitemap.xml.tsx`, dan robots.txt sudah mengizinkan semua
  crawler (termasuk `bingbot`) mengakses seluruh halaman kecuali `/api/*`.
- **`public/BingSiteAuth.xml`** — placeholder untuk metode verifikasi "XML file". Ganti isinya
  dengan file asli yang kamu unduh dari Bing Webmaster Tools (instruksi lengkap ada di komentar
  dalam file itu sendiri).
- **Meta tag alternatif** — kalau lebih suka metode "meta tag" daripada upload file, isi env var
  `NEXT_PUBLIC_BING_SITE_VERIFICATION` di `.env` dengan kode dari Bing, dan tag
  `<meta name="msvalidate.01">` akan otomatis muncul di `_document.tsx`. (Pola yang sama juga
  tersedia untuk Google Search Console lewat `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, kalau mau.)

**Langkah setelah deploy:**

1. Buka [Bing Webmaster Tools](https://www.bing.com/webmasters), tambahkan `https://savenest.web.id`.
2. Verifikasi lewat salah satu metode di atas (XML file atau meta tag) — pilih salah satu saja.
3. Setelah terverifikasi, buka menu **Sitemaps**, submit `https://savenest.web.id/sitemap.xml`.
4. (Opsional, untuk indexing lebih cepat) Aktifkan **IndexNow** dari dashboard Bing Webmaster
   Tools — ini protokol modern pengganti "ping" lama, membuat halaman baru/berubah terindeks lebih
   cepat di Bing/Yahoo tanpa menunggu crawl terjadwal.

Proses indexing biasanya makan waktu beberapa minggu setelah verifikasi & submit sitemap — ini
normal dan di luar kendali kode di proyek ini.

---

## 🗂️ Struktur Proyek

```
savenest/
├── public/                  # asset statis, manifest, service worker, icon
├── scripts/
│   └── generate-icons.py    # generator icon/OG image (Pillow, offline)
├── src/
│   ├── components/
│   │   ├── chat/             # ChatWidget (AI support, floating)
│   │   ├── common/          # Button, GlassCard, Skeleton, ErrorBoundary, InlineMarkdown
│   │   ├── home/             # Hero, DownloaderForm, ResultCard, FAQ, dst.
│   │   ├── layout/            # Header, Footer, Layout, SEO, PageShell
│   │   └── loading/           # DownloadLoadingOverlay
│   ├── hooks/                 # useDownloader, useGlobalStats, useDebounce, useChat, useTurnstile
│   ├── lib/
│   │   ├── ai/                  # scopedPrompt.ts (pembatas topik AI)
│   │   ├── api/                # client upstream (blckrose.ts, gemini.ts)
│   │   ├── cache/              # cache store (Netlify Blobs)
│   │   ├── security/           # validator URL, rate limiter, guards, turnstile.ts
│   │   ├── store/               # blobStore + globalQuota
│   │   ├── constants.ts
│   │   └── seo.ts
│   ├── pages/
│   │   ├── api/                 # download.ts, stats.ts, chat.ts
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
  bermerek yang layak pakai — ganti dengan aset desain final kapan pun kamu siap. Script ini murni
  dev tool (tidak dijalankan saat build/deploy), butuh Python + Pillow:
  ```bash
  pip install -r scripts/requirements.txt
  python3 scripts/generate-icons.py
  ```
- Rate limiter per-IP bersifat in-memory per instance Function (lihat komentar di
  `ipRateLimiter.ts`) — cukup untuk membendung abuse dari satu klien, tapi bukan pengganti kuota
  global (yang durable lewat Netlify Blobs).

---

## 📄 Lisensi

Lihat [LICENSE](./LICENSE). Konten yang diunduh pengguna tetap menjadi hak cipta pemiliknya
masing-masing — lihat [/dmca](./src/pages/dmca.tsx) dan [/disclaimer](./src/pages/disclaimer.tsx).

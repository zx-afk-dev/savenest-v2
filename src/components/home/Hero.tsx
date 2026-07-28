import { DownloaderForm } from '@/components/home/DownloaderForm';

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-brand-700 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
          Tanpa watermark · Tanpa aplikasi tambahan
        </span>

        <h1 className="animate-fade-up mt-6 font-display text-4xl font-extrabold leading-tight text-ink-900 sm:text-5xl [animation-delay:80ms]">
          Simpan video favoritmu, <span className="text-brand-600">secepat mengetik URL.</span>
        </h1>

        <p className="animate-fade-up mx-auto mt-4 max-w-xl text-base text-ink-800/70 [animation-delay:160ms]">
          SaveNest mengunduh video dari TikTok, Instagram, dan YouTube langsung dari browser —
          tempel tautannya, pilih kualitas, selesai.
        </p>
      </div>

      <div className="animate-fade-up relative mx-auto mt-10 max-w-2xl [animation-delay:240ms]">
        <DownloaderForm />
      </div>
    </section>
  );
}

interface QuotaExhaustedProps {
  resetsAt: string;
}

export function QuotaExhausted({ resetsAt }: QuotaExhaustedProps) {
  const resetTime = new Date(resetsAt).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'long',
  });

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-600/10">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-brand-600" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>

      <h1 className="mt-6 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
        Kuota Download Hari Ini Sudah Habis
      </h1>
      <p className="mt-3 max-w-md text-ink-800/70">
        Hari ini kuota download SaveNest sudah habis. Silakan kembali besok.
      </p>
      <p className="mt-1 text-sm text-ink-800/50">Kuota akan direset sekitar {resetTime} WIB.</p>
    </section>
  );
}

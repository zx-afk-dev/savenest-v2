import { useGlobalStats } from '@/hooks/useGlobalStats';

export function GlobalStats() {
  const { stats, loading } = useGlobalStats();
  const percentUsed = stats ? Math.min(100, Math.round((stats.used / stats.limit) * 100)) : 0;

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <div className="glass-panel-strong flex flex-col items-center gap-5 p-8 text-center">
        <h2 className="font-display text-xl font-bold text-ink-900">Statistik Global Hari Ini</h2>

        {loading || !stats ? (
          <div className="h-10 w-40 animate-pulse rounded-xl bg-mist-200" />
        ) : (
          <p className="font-mono text-3xl font-bold text-brand-700">
            {stats.used} / {stats.limit}
            <span className="ml-2 font-body text-sm font-medium text-ink-800/60">
              Request Hari Ini
            </span>
          </p>
        )}

        <div className="h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-mist-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-[width] duration-500"
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        <p className="text-xs text-ink-800/50">
          Kuota dibagikan oleh seluruh pengguna dan direset otomatis setiap pukul 00:00 WIB.
        </p>
      </div>
    </section>
  );
}

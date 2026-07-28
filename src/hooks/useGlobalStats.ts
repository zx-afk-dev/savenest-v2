import { useEffect, useState } from 'react';
import type { GlobalStats } from '@/types';

const POLL_INTERVAL_MS = 30_000;

export function useGlobalStats() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/stats');
        const payload = await res.json();
        if (!cancelled && payload.success) {
          setStats(payload.data);
        }
      } catch {
        // Silently ignore — the widget just won't update this tick.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading };
}

import { getBlobStore } from '@/lib/store/blobStore';
import { GLOBAL_DAILY_LIMIT, QUOTA_TIMEZONE_OFFSET_MINUTES } from '@/lib/constants';
import type { GlobalStats } from '@/types';

const STORE_NAME = 'savenest-quota';
const QUOTA_KEY = 'daily-usage';

interface QuotaRecord {
  /** e.g. "2026-07-28" in WIB, identifies which day this counter belongs to */
  dateKey: string;
  used: number;
}

function wibDateKeyFor(date: Date): string {
  const shifted = new Date(date.getTime() + QUOTA_TIMEZONE_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 10); // YYYY-MM-DD
}

function nextResetAtIso(now: Date): string {
  const shifted = new Date(now.getTime() + QUOTA_TIMEZONE_OFFSET_MINUTES * 60_000);
  const nextMidnightWib = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + 1, 0, 0, 0),
  );
  // Convert the WIB midnight back to a real UTC instant.
  return new Date(nextMidnightWib.getTime() - QUOTA_TIMEZONE_OFFSET_MINUTES * 60_000).toISOString();
}

async function readRecord(): Promise<QuotaRecord> {
  const store = getBlobStore(STORE_NAME);
  const existing = await store.get<QuotaRecord>(QUOTA_KEY);
  const todayKey = wibDateKeyFor(new Date());

  if (!existing || existing.dateKey !== todayKey) {
    // Either first-ever request, or the WIB day has rolled over — reset.
    return { dateKey: todayKey, used: 0 };
  }
  return existing;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const record = await readRecord();
  return {
    limit: GLOBAL_DAILY_LIMIT,
    used: record.used,
    remaining: Math.max(0, GLOBAL_DAILY_LIMIT - record.used),
    resetsAt: nextResetAtIso(new Date()),
  };
}

/**
 * Atomically-ish increments today's usage counter and returns whether the
 * request should be allowed. Netlify Blobs doesn't expose a native atomic
 * increment, so we accept a small race window under heavy concurrency; given
 * the modest 60/day limit this is an acceptable trade-off versus adding a
 * real database. For stricter guarantees, swap this for Netlify Blobs'
 * `setJSON` with an ETag/`onlyIfMatch` compare-and-swap loop.
 */
export async function tryConsumeGlobalQuota(): Promise<{
  allowed: boolean;
  stats: GlobalStats;
}> {
  const store = getBlobStore(STORE_NAME);
  const record = await readRecord();

  if (record.used >= GLOBAL_DAILY_LIMIT) {
    return {
      allowed: false,
      stats: {
        limit: GLOBAL_DAILY_LIMIT,
        used: record.used,
        remaining: 0,
        resetsAt: nextResetAtIso(new Date()),
      },
    };
  }

  const updated: QuotaRecord = { ...record, used: record.used + 1 };
  await store.set(QUOTA_KEY, updated);

  return {
    allowed: true,
    stats: {
      limit: GLOBAL_DAILY_LIMIT,
      used: updated.used,
      remaining: Math.max(0, GLOBAL_DAILY_LIMIT - updated.used),
      resetsAt: nextResetAtIso(new Date()),
    },
  };
      }

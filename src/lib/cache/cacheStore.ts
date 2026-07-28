import { getBlobStore } from '@/lib/store/blobStore';
import { CACHE_TTL_SECONDS } from '@/lib/constants';
import type { DownloadResult } from '@/types';

const STORE_NAME = 'savenest-cache';

interface CacheEntry {
  result: DownloadResult;
  expiresAt: number; // epoch ms
}

async function keyFor(url: string): Promise<string> {
  // A lightweight, dependency-free digest is enough here — this only needs
  // to be a stable, filesystem/blob-key-safe identifier, not cryptographic.
  const { createHash } = await import('crypto');
  return `url:${createHash('sha256').update(url).digest('hex')}`;
}

export async function getCached(url: string): Promise<DownloadResult | null> {
  const store = getBlobStore(STORE_NAME);
  const key = await keyFor(url);
  const entry = await store.get<CacheEntry>(key);

  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    await store.delete(key);
    return null;
  }
  return { ...entry.result, cached: true };
}

export async function setCached(url: string, result: DownloadResult): Promise<void> {
  const store = getBlobStore(STORE_NAME);
  const key = await keyFor(url);
  const entry: CacheEntry = {
    result,
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
  };
  await store.set(key, entry);
}

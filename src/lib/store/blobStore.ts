/**
 * Persistent key-value storage abstraction.
 *
 * WHY THIS EXISTS
 * ----------------
 * The brief asks for a global daily quota + a 10-minute response cache
 * *without a database*. On a normal long-running Node server you could keep
 * that state in an in-memory object or write it to a local JSON file on disk.
 *
 * Netlify Functions (which is what Next.js API routes compile to when
 * deployed via @netlify/plugin-nextjs) do NOT give you that. Each invocation
 * may run on a fresh, isolated container, there is no shared local disk
 * between invocations/regions, and in-memory objects are wiped whenever the
 * function is recycled. A "store counts in a local .json file" approach will
 * *appear* to work in `next dev` and then silently reset/fragment in
 * production — exactly the kind of broken-but-looks-fine solution the brief
 * warns against.
 *
 * The correct fix is Netlify Blobs: a small, free, zero-config key-value
 * store that is available to every Function/Edge Function on a Netlify site
 * without provisioning a database. We use it here for both the global quota
 * counter and the response cache.
 *
 * For local development (`npm run dev`, no Netlify context available) we
 * transparently fall back to a JSON file under `.data/` so the app still
 * runs with `npm install && npm run dev` out of the box. That fallback is
 * ONLY used locally — see `isNetlifyRuntime()` below.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface BlobStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

function isNetlifyRuntime(): boolean {
  // Set automatically by the Netlify platform on Functions/Edge Functions.
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

class NetlifyBlobStore implements BlobStore {
  private storeName: string;

  constructor(storeName: string) {
    this.storeName = storeName;
  }

  private async getStore() {
    // Lazy import so this package is never touched in local dev, where it
    // isn't configured and would throw.
    const { getStore } = await import('@netlify/blobs');
    return getStore({ name: this.storeName, consistency: 'strong' });
  }

  async get<T>(key: string): Promise<T | null> {
    const store = await this.getStore();
    const value = await store.get(key, { type: 'json' });
    return (value as T) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const store = await this.getStore();
    await store.setJSON(key, value as object);
  }

  async delete(key: string): Promise<void> {
    const store = await this.getStore();
    await store.delete(key);
  }
}

/**
 * Local-dev-only fallback. NOT used in production. Writes to a git-ignored
 * `.data/<store>.json` file so `npm run dev` works without any Netlify
 * emulation. State here is best-effort and per-machine only, which is fine
 * because it never runs on the real multi-instance serverless deployment.
 */
class LocalFileBlobStore implements BlobStore {
  private filePath: string;
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(storeName: string) {
    this.filePath = path.join(process.cwd(), '.data', `${storeName}.json`);
  }

  private async readAll(): Promise<Record<string, unknown>> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private async writeAll(data: Record<string, unknown>): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async get<T>(key: string): Promise<T | null> {
    const all = await this.readAll();
    return (all[key] as T) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    // Serialize writes so concurrent requests in dev don't clobber each other.
    this.writeQueue = this.writeQueue.then(async () => {
      const all = await this.readAll();
      all[key] = value;
      await this.writeAll(all);
    });
    await this.writeQueue;
  }

  async delete(key: string): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      const all = await this.readAll();
      delete all[key];
      await this.writeAll(all);
    });
    await this.writeQueue;
  }
}

const stores = new Map<string, BlobStore>();

export function getBlobStore(storeName: string): BlobStore {
  const existing = stores.get(storeName);
  if (existing) return existing;

  const store = isNetlifyRuntime()
    ? new NetlifyBlobStore(storeName)
    : new LocalFileBlobStore(storeName);

  stores.set(storeName, store);
  return store;
  }
    

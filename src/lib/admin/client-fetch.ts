"use client";

type CacheEntry = {
  data: unknown;
  status: number;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

const DEFAULT_TTL_MS = 60_000;

export function invalidateAdminCache(urlPrefix?: string) {
  if (!urlPrefix) {
    cache.clear();
    return;
  }
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(urlPrefix)) cache.delete(key);
  }
}

export async function adminFetchJson<T = unknown>(
  url: string,
  init?: RequestInit & { ttlMs?: number; skipCache?: boolean }
): Promise<{ ok: boolean; status: number; data: T }> {
  const method = init?.method ?? "GET";
  const isGet = method === "GET";
  const ttl = init?.ttlMs ?? DEFAULT_TTL_MS;
  const skipCache = init?.skipCache ?? !isGet;

  if (isGet && !skipCache) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.fetchedAt < ttl) {
      return {
        ok: hit.status >= 200 && hit.status < 300,
        status: hit.status,
        data: hit.data as T,
      };
    }
    const pending = inflight.get(url);
    if (pending) {
      const entry = await pending;
      return {
        ok: entry.status >= 200 && entry.status < 300,
        status: entry.status,
        data: entry.data as T,
      };
    }
  }

  const run = async (): Promise<CacheEntry> => {
    const res = await fetch(url, init);
    const data = await res.json().catch(() => ({}));
    const entry: CacheEntry = { data, status: res.status, fetchedAt: Date.now() };
    if (isGet && !skipCache) cache.set(url, entry);
    if (!isGet) invalidateAdminCache();
    return entry;
  };

  if (isGet && !skipCache) {
    const promise = run();
    inflight.set(url, promise);
    try {
      const entry = await promise;
      return {
        ok: entry.status >= 200 && entry.status < 300,
        status: entry.status,
        data: entry.data as T,
      };
    } finally {
      inflight.delete(url);
    }
  }

  const entry = await run();
  return {
    ok: entry.status >= 200 && entry.status < 300,
    status: entry.status,
    data: entry.data as T,
  };
}

export function prefetchAdminJson(url: string) {
  void adminFetchJson(url);
}

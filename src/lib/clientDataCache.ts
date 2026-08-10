type CacheEntry = { data: unknown; fetchedAt: number };

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 60_000;

export function getCachedJson<T>(url: string, ttlMs = DEFAULT_TTL_MS): T | undefined {
  const hit = cache.get(url);
  if (!hit) return undefined;
  if (Date.now() - hit.fetchedAt > ttlMs) return undefined;
  return hit.data as T;
}

export async function fetchJsonCached<T>(
  url: string,
  opts?: { ttlMs?: number; force?: boolean; init?: RequestInit },
): Promise<T> {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  if (!opts?.force) {
    const hit = getCachedJson<T>(url, ttlMs);
    if (hit !== undefined) return hit;
    const pending = inflight.get(url);
    if (pending) return pending as Promise<T>;
  }

  const request = fetch(url, { cache: "no-store", ...opts?.init })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
      cache.set(url, { data, fetchedAt: Date.now() });
      return data as T;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, request);
  return request;
}

export function invalidateCachedUrl(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

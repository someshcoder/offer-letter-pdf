import type { AccessRole } from "@/types/employee";

export type SessionUser = {
  id: string;
  email: string;
  role: AccessRole;
  name?: string;
  sessionId?: string;
};

type MeResponse = {
  user?: SessionUser | null;
};

let sessionRequest: Promise<SessionUser | null> | null = null;
let sessionCache: { user: SessionUser | null; fetchedAt: number } | null = null;

const SESSION_CACHE_TTL_MS = 5 * 60_000;

export function getCachedSessionUser(): SessionUser | null | undefined {
  if (!sessionCache) return undefined;
  if (Date.now() - sessionCache.fetchedAt > SESSION_CACHE_TTL_MS) return undefined;
  return sessionCache.user;
}

export async function fetchSessionUser(options?: { force?: boolean }): Promise<SessionUser | null> {
  const cached = getCachedSessionUser();
  if (!options?.force && cached !== undefined) {
    return cached;
  }

  if (!sessionRequest) {
    sessionRequest = (async () => {
      const res = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });
      const data = (await res.json()) as MeResponse;
      if (!res.ok) return null;
      return data.user || null;
    })().finally(() => {
      sessionRequest = null;
    });
  }

  const user = await sessionRequest;
  sessionCache = { user, fetchedAt: Date.now() };
  return user;
}

export function clearSessionCache() {
  sessionCache = null;
}

export function isSessionStale(maxAgeMs = 30_000): boolean {
  if (!sessionCache) return true;
  return Date.now() - sessionCache.fetchedAt > maxAgeMs;
}

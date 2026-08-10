"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchSessionUser,
  getCachedSessionUser,
  clearSessionCache,
  isSessionStale,
  type SessionUser,
} from "@/lib/clientSession";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cached = getCachedSessionUser();
  const [user, setUser] = useState<SessionUser | null>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined);

  const refresh = useCallback(async () => {
    const next = await fetchSessionUser({ force: true });
    setUser(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    const hit = getCachedSessionUser();
    if (hit !== undefined) {
      setLoading(false);
      if (isSessionStale()) {
        fetchSessionUser({ force: true })
          .then((next) => setUser(next))
          .catch(() => {});
      }
      return;
    }

    let active = true;
    fetchSessionUser()
      .then((next) => {
        if (active) setUser(next);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh }),
    [user, loading, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

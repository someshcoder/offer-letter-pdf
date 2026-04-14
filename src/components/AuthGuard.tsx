"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AccessRole } from "@/types/employee";

type MeResponse = {
  user?: {
    id: string;
    email: string;
    role: AccessRole;
  } | null;
};

const roleRouteMap: Record<AccessRole, string[]> = {
  Admin: ["/dashboard", "/employees", "/offer-letter", "/tls"],
  HR: ["/dashboard", "/employees", "/offer-letter", "/tls"],
  TL: ["/dashboard", "/employees", "/offer-letter", "/tls"],
  Employee: ["/offer-letter"],
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/auth");

  useEffect(() => {
    if (isAuthRoute) {
      setLoading(false);
    }
  }, [isAuthRoute]);

  useEffect(() => {
    if (isAuthRoute) return;

    let active = true;

    async function validate() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await res.json()) as MeResponse;
        const user = data.user || null;

        if (!active) return;

        if (!res.ok || !user) {
          router.replace("/login");
          return;
        }

        const allowedRoutes = roleRouteMap[user.role] || [];
        const allowed = allowedRoutes.some((route) => pathname.startsWith(route));
        if (!allowed) {
          router.replace("/offer-letter");
          return;
        }
      } catch {
        if (active) {
          router.replace("/login");
          return;
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    validate();

    return () => {
      active = false;
    };
  }, [isAuthRoute, pathname, router]);

  if (loading && !isAuthRoute) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <p className="text-sm font-medium">Checking session...</p>
      </div>
    );
  }

  return <>{children}</>;
}

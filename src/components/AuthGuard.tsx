"use client";

import { memo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { defaultRouteForRole, isPathAllowedForRole } from "@/lib/navigation";

function ContentSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent"
        aria-label="Loading"
      />
    </div>
  );
}

export const AuthGuard = memo(function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthRoute =
    pathname === "/login" || pathname === "/register" || pathname.startsWith("/auth");

  useEffect(() => {
    if (isAuthRoute || loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isPathAllowedForRole(pathname, user.role)) {
      router.replace(defaultRouteForRole(user.role));
    }
  }, [isAuthRoute, loading, pathname, router, user]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (loading && !user) {
    return <ContentSpinner />;
  }

  if (!user) {
    return null;
  }

  if (!isPathAllowedForRole(pathname, user.role)) {
    return <ContentSpinner />;
  }

  return <>{children}</>;
});

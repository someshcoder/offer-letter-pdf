"use client";

import { memo, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import type { CompanyBranding } from "@/lib/companySettings";

type Theme = "light" | "dark";

let brandingCache: CompanyBranding | null = null;

export function setBrandingCache(branding: CompanyBranding) {
  brandingCache = branding;
}

function DashboardShellInner({
  children,
  initialTheme,
  initialBranding,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
  initialBranding: CompanyBranding;
}) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<CompanyBranding>(() => brandingCache ?? initialBranding);

  useEffect(() => {
    brandingCache = initialBranding;
    setBranding(initialBranding);
  }, [initialBranding]);

  return (
    <AppShell
      initialTheme={initialTheme}
      userRole={user?.role}
      companyName={branding.companyName}
      companyLogo={branding.companyLogo}
    >
      <AuthGuard>{children}</AuthGuard>
    </AppShell>
  );
}

const MemoDashboardShellInner = memo(DashboardShellInner);

export const DashboardShell = memo(function DashboardShell({
  children,
  initialTheme,
  initialBranding,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
  initialBranding: CompanyBranding;
}) {
  return (
    <AuthProvider>
      <MemoDashboardShellInner initialTheme={initialTheme} initialBranding={initialBranding}>
        {children}
      </MemoDashboardShellInner>
    </AuthProvider>
  );
});

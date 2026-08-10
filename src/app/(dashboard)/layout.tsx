import { cookies } from "next/headers";
import { DashboardShell } from "@/components/DashboardShell";
import { getCompanySettings } from "@/lib/companySettings";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookieStore, branding] = await Promise.all([cookies(), getCompanySettings()]);
  const themeCookie = cookieStore.get("ems-theme")?.value;
  const initialTheme = themeCookie === "dark" || themeCookie === "light" ? themeCookie : "light";

  return (
    <DashboardShell initialTheme={initialTheme} initialBranding={branding}>
      {children}
    </DashboardShell>
  );
}

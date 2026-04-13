"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";

type Props = {
  initialTheme: "light" | "dark";
  children: React.ReactNode;
};

export function AppShell({ initialTheme, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        initialTheme={initialTheme}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/75 sm:px-6 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              <span aria-hidden>{mobileOpen ? "✕" : "☰"}</span>
              Menu
            </button>
            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
              Employee Management
            </p>
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const itemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition";
const inactive =
  "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";
const active =
  "bg-cyan-500/10 text-cyan-800 shadow-sm ring-1 ring-cyan-500/30 dark:bg-white/15 dark:text-white dark:ring-white/20";

type Props = {
  initialTheme: "light" | "dark";
};

export function AppSidebar({ initialTheme }: Props) {
  const pathname = usePathname();
  const onEditor = pathname === "/" || pathname.startsWith("/offer-letter");
  const onDashboard = pathname === "/dashboard";
  const onEmployees = pathname.startsWith("/employees");

  return (
    <aside
      className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white/75 text-slate-900 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-100"
      aria-label="Main navigation"
    >
      <div className="border-b border-slate-200 p-5 dark:border-slate-800">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-indigo-400">
          EMS Suite
        </p>
        <h1 className="mt-2 text-lg font-bold leading-tight text-slate-900 dark:text-white">
          Employee manager
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Control center</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href="/dashboard"
          className={`${itemBase} ${onDashboard ? active : inactive}`}
        >
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-600/50 dark:text-slate-200"
            aria-hidden
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </span>
          Dashboard
        </Link>
        <Link
          href="/employees"
          className={`${itemBase} ${onEmployees ? active : inactive}`}
        >
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
            aria-hidden
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5V4H2v16h5m10 0v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6m10 0H7"
              />
            </svg>
          </span>
          Employees
        </Link>
        <Link
          href="/offer-letter"
          className={`${itemBase} ${onEditor ? active : inactive}`}
        >
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
            aria-hidden
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </span>
          Offer letter
        </Link>
      </nav>

      <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
        <ThemeToggle initialTheme={initialTheme} />
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition";
const inactive =
  "text-slate-300 hover:bg-white/10 hover:text-white";
const active =
  "bg-white/15 text-white shadow-sm ring-1 ring-white/20";

export function AppSidebar() {
  const pathname = usePathname();
  const onEditor = pathname === "/";
  const onDashboard = pathname === "/dashboard";

  return (
    <aside
      className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-900 text-slate-100"
      aria-label="Main navigation"
    >
      <div className="border-b border-slate-800 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
          PDF Editor Admin
        </p>
        <h1 className="mt-2 text-lg font-bold leading-tight text-white">
          Offer letter
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href="/dashboard"
          className={`${itemBase} ${onDashboard ? active : inactive}`}
        >
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-slate-600/50 text-slate-200"
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
          Saved letters
        </Link>
        <Link
          href="/"
          className={`${itemBase} ${onEditor ? active : inactive}`}
        >
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300"
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

      <div className="border-t border-slate-800 p-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          Template
        </p>
        <p className="mt-1 text-xs text-slate-400">sample.pdf</p>
      </div>
    </aside>
  );
}

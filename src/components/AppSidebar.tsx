"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";
import { clearSessionCache } from "@/lib/clientSession";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  getVisibleSections,
  isNavActive,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import type { AccessRole } from "@/types/employee";

const itemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150";
const inactive =
  "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";
const active =
  "bg-cyan-500/10 text-cyan-800 shadow-sm ring-1 ring-cyan-500/30 dark:bg-white/15 dark:text-white dark:ring-white/20";

const kindClass: Record<NonNullable<NavItem["kind"]>, string> = {
  Flow: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
  Record: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Tool: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  Document: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
};

type Props = {
  initialTheme: "light" | "dark";
  userRole?: AccessRole;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  companyName?: string;
  companyLogo?: string | null;
};

function NavLink({
  item,
  pathname,
  onCloseMobile,
  compact,
}: {
  item: NavItem;
  pathname: string;
  onCloseMobile: () => void;
  compact?: boolean;
}) {
  const { href, label, description, kind } = item;
  const isActive = isNavActive(pathname, href);
  const router = useRouter();
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onCloseMobile}
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      title={description}
      className={`${itemBase} items-start ${compact ? "py-2 text-xs" : ""} ${isActive ? active : inactive}`}
    >
      <span className={`mt-1 size-1.5 shrink-0 rounded-full ${isActive ? "bg-cyan-600 dark:bg-white" : "bg-slate-300 dark:bg-slate-600"}`} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate">{label}</span>
          {!compact && kind ? (
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${kindClass[kind]}`}>
              {kind}
            </span>
          ) : null}
        </span>
        {!compact && description ? (
          <span className={`mt-0.5 block truncate text-[11px] font-normal ${isActive ? "text-cyan-700/80 dark:text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
            {description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

const MemoNavLink = memo(NavLink);

function CollapsibleSection({
  section,
  pathname,
  onCloseMobile,
}: {
  section: NavSection;
  pathname: string;
  onCloseMobile: () => void;
}) {
  const sectionActive = section.items.some((item) => isNavActive(pathname, item.href));
  const [open, setOpen] = useState(sectionActive);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        className={`${itemBase} w-full justify-between ${open || sectionActive ? "text-slate-900 dark:text-white" : inactive}`}
      >
        <span>{section.label}</span>
        <svg
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-150 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="ml-3 flex flex-col gap-0.5 border-l border-slate-200 pl-3 pt-1 dark:border-slate-800">
            {section.items.map((item) => (
              <MemoNavLink
                key={item.href}
                item={item}
                pathname={pathname}
                onCloseMobile={onCloseMobile}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const AppSidebar = memo(function AppSidebar({
  initialTheme,
  userRole,
  mobileOpen,
  onCloseMobile,
  companyName,
  companyLogo,
}: Props) {
  const pathname = usePathname();
  const sections = useMemo(() => getVisibleSections(userRole), [userRole]);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 transition-opacity duration-150 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 max-w-[85vw] shrink-0 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-xl transition-transform duration-150 will-change-transform dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:sticky lg:top-0 lg:z-20 lg:w-72 lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
          {companyLogo ? (
            <img src={companyLogo} alt="Logo" className="h-10 w-10 rounded-lg bg-slate-50 object-contain p-1 dark:bg-slate-800" />
          ) : companyName ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-600/10">
              <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                {companyName.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : null}
          {companyName ? (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold leading-tight text-slate-900 dark:text-white">
                {companyName}
              </h1>
            </div>
          ) : null}
        </div>

        <nav className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-3">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              {!section.collapsible && (
                <p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {section.label}
                </p>
              )}
              {section.collapsible ? (
                <CollapsibleSection section={section} pathname={pathname} onCloseMobile={onCloseMobile} />
              ) : (
                section.items.map((item) => (
                  <MemoNavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onCloseMobile={onCloseMobile}
                  />
                ))
              )}
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
          <ThemeToggle initialTheme={initialTheme} />
          <button
            type="button"
            onClick={async () => {
              clearSessionCache();
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
});

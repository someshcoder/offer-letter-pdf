"use client";

import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";

const mod = MODULE_REGISTRY.customers;

export function CustomersPageHeader() {
  return (
    <>
      <Breadcrumb items={moduleBreadcrumbs(mod.route)} />
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.16),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_38%)]"
          aria-hidden
        />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
              {mod.section}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {mod.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Customer contact, company, status, and notes — simple record keeping. Domain and hosting are in separate modules.
            </p>
          </div>
        </div>
      </header>
    </>
  );
}

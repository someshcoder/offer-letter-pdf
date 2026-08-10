"use client";

import Link from "next/link";
import { DOCUMENT_MODULES, MODULE_REGISTRY, NAV_SECTIONS } from "@/lib/navigation";

const kindClass: Record<string, string> = {
  Flow: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
  Record: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Tool: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  Document: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
};

export function ModuleGuide() {
  const businessModules = Object.values(MODULE_REGISTRY);
  const documentModules = Object.values(DOCUMENT_MODULES);

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Module Guide</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Quick map of where each feature lives and whether it is a connected flow, record module, tool, or document.
        </p>
      </div>

      {NAV_SECTIONS.map((section) => (
        <div key={section.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {section.label}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <Link
                key={`${section.id}:${item.href}`}
                href={item.href}
                className="rounded-xl border border-slate-100 px-3 py-2 transition-colors hover:border-cyan-400 dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  {item.kind && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${kindClass[item.kind]}`}>
                      {item.kind}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
        <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">API routes (business modules)</h3>
        <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-400 sm:grid-cols-2">
          {businessModules.map((m) => (
            <p key={m.route}>
              <span className="font-medium text-slate-800 dark:text-slate-200">{m.title}</span>
              {" — "}
              <code className="rounded bg-white px-1 dark:bg-slate-900">{m.api}</code>
            </p>
          ))}
        </div>
        <h3 className="mb-2 mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">Document modules</h3>
        <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-400 sm:grid-cols-2">
          {documentModules.map((m) => (
            <p key={m.route}>
              <span className="font-medium text-slate-800 dark:text-slate-200">{m.title}</span>
              {" — "}
              <code className="rounded bg-white px-1 dark:bg-slate-900">{m.api}</code>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

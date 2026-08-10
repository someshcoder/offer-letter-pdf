"use client";

import Link from "next/link";

export type FinancePageId = "payments" | "ledger" | "staff-expenses" | "office-expenses";

const PAGE_COPY: Record<
  FinancePageId,
  { title: string; who: string; action: string; next?: { href: string; label: string } }
> = {
  payments: {
    title: "Collect customer payments",
    who: "Customer → pays you for the project",
    action:
      "Select customer → project auto-fills → enter total amount + amount received → Save. Later use 'Receive Payment' to record the remaining balance.",
    next: { href: "/payment-ledger", label: "View summary (Ledger)" },
  },
  ledger: {
    title: "Full payment overview",
    who: "Shows everything — customer incoming, outstanding due, and staff/office outgoing",
    action:
      "This page is read-only. To add a new payment, go to Customer Payments.",
    next: { href: "/payments", label: "New customer payment" },
  },
  "staff-expenses": {
    title: "Pay staff (reimbursement)",
    who: "Employee → claims travel, food, fuel → you approve and pay",
    action:
      "Select employee name → category + amount → Save. After approval, it appears in Ledger under 'Outgoing'.",
    next: { href: "/payment-ledger", label: "View in ledger" },
  },
  "office-expenses": {
    title: "Office expenses",
    who: "Company → rent, bills, supplies (separate from customer payments)",
    action:
      "Enter category + title + amount. This is not mixed with customer payments — it is a separate office cost.",
    next: { href: "/payment-ledger", label: "View in ledger" },
  },
};

export function FinanceFlowGuide({ page }: { page: FinancePageId }) {
  const copy = PAGE_COPY[page];

  return (
    <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 dark:border-cyan-900 dark:bg-cyan-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Finance guide
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{copy.title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Who → Where:</span> {copy.who}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{copy.action}</p>
        </div>
        {copy.next && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={copy.next.href}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
            >
              {copy.next.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

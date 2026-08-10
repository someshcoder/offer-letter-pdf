"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, IndianRupee, RefreshCw } from "lucide-react";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { FinanceFlowGuide } from "@/components/modules/FinanceFlowGuide";
import { StatusBadge } from "@/components/modules/ModuleCrudPage";
import { btnPrimary, btnSecondary } from "@/components/ui/FormUi";

type LedgerData = {
  stats: {
    totalExpected: number;
    totalReceived: number;
    totalDue: number;
    incomingCount: number;
    outgoingPaid: number;
    outgoingPending: number;
    netCash: number;
  };
  invoices: Array<{
    id: string;
    clientName: string;
    projectName: string;
    invoiceNumber?: string;
    paymentType?: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    paymentCount: number;
  }>;
  incomingTransactions: Array<{
    id: string;
    clientName: string;
    projectName: string;
    invoiceNumber?: string;
    amount: number;
    mode?: string;
    paidAt?: string;
    transactionRef?: string;
  }>;
  outgoingTransactions: Array<{
    id: string;
    type: string;
    employeeName: string;
    amount: number;
    status: string;
    date?: string;
    description?: string;
  }>;
};

function money(value: number) {
  return `₹${(value || 0).toLocaleString()}`;
}

function date(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function PaymentLedgerPage() {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "due" | "paid">("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-ledger", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ledger load failed");
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const invoices = useMemo(() => {
    const rows = data?.invoices || [];
    if (filter === "due") return rows.filter((row) => row.dueAmount > 0);
    if (filter === "paid") return rows.filter((row) => row.dueAmount <= 0);
    return rows;
  }, [data, filter]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Finance" },
            { label: "Payment Summary" },
          ]}
        />

        <FinanceFlowGuide page="ledger" />

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Finance — Read Only
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Payment Summary</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Track customer incoming, outstanding due, and staff/office outgoing — all in one place. Do not add new entries here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/payments" className={btnSecondary}>
                + Customer Payment
              </Link>
              <button type="button" onClick={load} className={btnPrimary}>
                <RefreshCw className="size-4" />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {loading || !data ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Loading ledger...
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Expected From Customers" value={money(data.stats.totalExpected)} icon={<IndianRupee className="size-5" />} />
              <StatCard label="Received" value={money(data.stats.totalReceived)} icon={<ArrowDownCircle className="size-5" />} positive />
              <StatCard label="Customer Due (outstanding)" value={money(data.stats.totalDue)} icon={<CreditCard className="size-5" />} negative={data.stats.totalDue > 0} />
              <StatCard label="Staff + Office Paid" value={money(data.stats.outgoingPaid)} icon={<ArrowUpCircle className="size-5" />} />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Customer Payments (Incoming)</h2>
                  <p className="text-xs text-slate-500">Expected from customer, amount received, and balance due.</p>
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="all">All</option>
                  <option value="due">Due Only</option>
                  <option value="paid">Paid Only</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-190 text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                      <th className="py-3">Customer</th>
                      <th>Project</th>
                      <th>Type</th>
                      <th>Total</th>
                      <th>Received</th>
                      <th>Due</th>
                      <th>Times</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">{invoice.clientName}</td>
                        <td>{invoice.projectName}</td>
                        <td>{invoice.paymentType || "—"}</td>
                        <td>{money(invoice.totalAmount)}</td>
                        <td className="font-semibold text-emerald-600">{money(invoice.paidAmount)}</td>
                        <td className={invoice.dueAmount > 0 ? "font-semibold text-rose-600" : "text-slate-500"}>{money(invoice.dueAmount)}</td>
                        <td>{invoice.paymentCount}</td>
                        <td><StatusBadge status={invoice.status} /></td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">No invoices found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <LedgerList
                title="Payment Received (when & how much)"
                empty="No payment received history yet. Record payments from Customer Payments."
                rows={data.incomingTransactions.map((row) => ({
                  id: row.id,
                  title: `${row.clientName} · ${row.projectName}`,
                  subtitle: `${row.mode || "Payment"} · ${date(row.paidAt)}${row.transactionRef ? ` · ${row.transactionRef}` : ""}`,
                  amount: `+ ${money(row.amount)}`,
                  positive: true,
                }))}
              />

              <LedgerList
                title="Money OUT (Staff, Salary, Office)"
                empty="No outgoing records yet."
                rows={data.outgoingTransactions.map((row) => ({
                  id: `${row.type}-${row.id}`,
                  title: `${row.employeeName} · ${row.type}`,
                  subtitle: `${row.description || ""} · ${date(row.date)}`,
                  amount: `- ${money(row.amount)}`,
                  status: row.status,
                  negative: row.status === "Paid",
                }))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  positive,
  negative,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-xl p-2 ${
            positive
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
              : negative
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                : "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function LedgerList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ id: string; title: string; subtitle: string; amount: string; status?: string; positive?: boolean; negative?: boolean }>;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 font-bold text-slate-900 dark:text-white">{title}</h2>
      <div className="max-h-120 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{row.title}</p>
              <p className="truncate text-xs text-slate-500">{row.subtitle}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-sm font-bold ${row.positive ? "text-emerald-600" : row.negative ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>
                {row.amount}
              </p>
              {row.status && <StatusBadge status={row.status} />}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950/50">{empty}</p>}
      </div>
    </section>
  );
}

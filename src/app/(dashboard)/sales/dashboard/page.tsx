"use client";

import { useCallback, useEffect, useState, Fragment } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { btnPrimary, btnSecondary } from "@/components/modules/DataTable";

type SalesStats = {
  customers: number;
  leads: number;
  convertedLeads: number;
  salesValue: number;
  paymentsReceived: number;
  paymentsDue: number;
};

type PrizeProgress = {
  _id: string;
  title: string;
  description: string;
  reward: string;
  metric: string;
  metricLabel: string;
  targetValue: number;
  period: string;
  currentValue: number;
  remaining: number;
  progressPercent: number;
  achieved: boolean;
};

type TeamRow = {
  employeeId: string;
  employeeName: string;
  stats: SalesStats;
  prizesAchieved: number;
  prizesTotal: number;
  nextPrize: PrizeProgress | null;
  prizes: PrizeProgress[];
};

type MeData = {
  scope: "me";
  employeeId: string;
  employeeName: string;
  stats: SalesStats;
  monthlyStats: SalesStats;
  prizes: PrizeProgress[];
  prizesAchieved: number;
  prizesTotal: number;
  nextPrize: PrizeProgress | null;
};

type TeamData = {
  scope: "team";
  team: TeamRow[];
  summary: {
    people: number;
    totalCustomers: number;
    totalPaymentsReceived: number;
    totalSalesValue: number;
    totalDue: number;
    totalPrizesAchieved: number;
  };
};

function money(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function formatMetric(metric: string, value: number) {
  if (metric === "sales_value" || metric === "payments_received") return money(value);
  return String(value);
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

function PrizeCard({ prize }: { prize: PrizeProgress }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        prize.achieved
          ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {prize.period === "monthly" ? "This month" : "All time"} · {prize.metricLabel}
          </p>
          <h3 className="mt-1 font-bold text-slate-900 dark:text-white">{prize.title}</h3>
          <p className="mt-1 text-sm text-cyan-700 dark:text-cyan-300">
            Reward: <span className="font-semibold">{prize.reward}</span>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
            prize.achieved
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {prize.achieved ? "Unlocked" : "In progress"}
        </span>
      </div>
      {prize.description ? (
        <p className="mt-2 text-xs text-slate-500">{prize.description}</p>
      ) : null}
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>
            {formatMetric(prize.metric, prize.currentValue)} / {formatMetric(prize.metric, prize.targetValue)}
          </span>
          <span>{prize.progressPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${prize.achieved ? "bg-emerald-500" : "bg-cyan-500"}`}
            style={{ width: `${prize.progressPercent}%` }}
          />
        </div>
        {!prize.achieved ? (
          <p className="mt-2 text-xs text-slate-500">
            Remaining: {formatMetric(prize.metric, prize.remaining)}
          </p>
        ) : (
          <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Target achieved!</p>
        )}
      </div>
    </div>
  );
}

export default function SalesDashboardPage() {
  const { user } = useAuth();
  const isManager = user?.role === "Admin" || user?.role === "HR" || user?.role === "TL";
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeData | null>(null);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isManager) {
        const [meRes, teamRes] = await Promise.all([
          fetch("/api/sales/performance?scope=me", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/sales/performance?scope=team", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (meRes.error) throw new Error(meRes.error);
        if (teamRes.error) throw new Error(teamRes.error);
        setMe(meRes);
        setTeam(teamRes);
      } else {
        const meRes = await fetch("/api/sales/performance?scope=me", { cache: "no-store" }).then((r) =>
          r.json(),
        );
        if (meRes.error) throw new Error(meRes.error);
        setMe(meRes);
        setTeam(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load sales dashboard");
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const stats = me?.stats;
  const monthly = me?.monthlyStats;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: isManager ? "/dashboard" : "/employee-dashboard" },
            { label: "Sales & Customers" },
            { label: "Sales Dashboard" },
          ]}
        />

        <header className="rounded-2xl border border-slate-200 bg-linear-to-br from-cyan-50 to-white p-6 dark:border-slate-800 dark:from-cyan-950/40 dark:to-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Sales Performance
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {isManager ? "Sales Dashboard" : "My Sales Dashboard"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                {isManager
                  ? "See every sales employee’s customers, payments, and prize progress. Configure prizes from Sales Prizes."
                  : "Your assigned customers, payments received, and prize unlock progress — only your numbers."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={load} className={btnSecondary}>
                Refresh
              </button>
              <Link href="/sales/leads" className={btnSecondary}>
                Leads
              </Link>
              <Link href="/payments" className={btnSecondary}>
                Payments
              </Link>
              {isManager && user?.role !== "TL" && (
                <Link href="/sales/prizes" className={btnPrimary}>
                  Set Prizes
                </Link>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Loading sales data…
          </div>
        ) : (
          <>
            {/* Personal / own stats for employee; managers also see own if they have sales data */}
            {!isManager && stats && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard label="My Customers" value={String(stats.customers)} />
                  <StatCard label="Leads Created" value={String(stats.leads)} hint={`${stats.convertedLeads} converted`} />
                  <StatCard label="Sales Value" value={money(stats.salesValue)} />
                  <StatCard label="Payment Received" value={money(stats.paymentsReceived)} />
                  <StatCard label="Payment Due" value={money(stats.paymentsDue)} />
                  <StatCard
                    label="Prizes Unlocked"
                    value={`${me?.prizesAchieved || 0}/${me?.prizesTotal || 0}`}
                    hint={monthly ? `This month received: ${money(monthly.paymentsReceived)}` : undefined}
                  />
                </div>

                {me?.nextPrize && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Next prize target
                    </p>
                    <p className="mt-1 font-bold text-slate-900 dark:text-white">
                      {me.nextPrize.title} — {me.nextPrize.reward}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Need {formatMetric(me.nextPrize.metric, me.nextPrize.remaining)} more ({me.nextPrize.metricLabel})
                    </p>
                  </div>
                )}

                <section>
                  <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Prize Ladder</h2>
                  {me?.prizes?.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {me.prizes.map((prize) => (
                        <PrizeCard key={prize._id} prize={prize} />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                      No prize rules yet. Admin will set targets and rewards soon.
                    </p>
                  )}
                </section>
              </>
            )}

            {/* Admin / HR / TL team view */}
            {isManager && team && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <StatCard label="Sales People" value={String(team.summary.people)} />
                  <StatCard label="Total Customers" value={String(team.summary.totalCustomers)} />
                  <StatCard label="Total Sales Value" value={money(team.summary.totalSalesValue)} />
                  <StatCard label="Payments Received" value={money(team.summary.totalPaymentsReceived)} />
                  <StatCard label="Outstanding Due" value={money(team.summary.totalDue)} />
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <h2 className="font-bold text-slate-900 dark:text-white">Team sales performance</h2>
                    <p className="text-xs text-slate-500">Each employee only sees their own data on My Sales Dashboard.</p>
                  </div>

                  {team.team.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-500">
                      No sales employees found yet. Assign customers/leads or add employees with Employee role.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-225 text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3">Customers</th>
                            <th className="px-4 py-3">Leads</th>
                            <th className="px-4 py-3">Sales Value</th>
                            <th className="px-4 py-3">Received</th>
                            <th className="px-4 py-3">Due</th>
                            <th className="px-4 py-3">Prizes</th>
                            <th className="px-4 py-3">Next target</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {team.team.map((row) => (
                            <Fragment key={row.employeeId}>
                              <tr
                                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/40"
                                onClick={() =>
                                  setExpandedId((id) => (id === row.employeeId ? null : row.employeeId))
                                }
                              >
                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                  {row.employeeName}
                                </td>
                                <td className="px-4 py-3">{row.stats.customers}</td>
                                <td className="px-4 py-3">
                                  {row.stats.leads}
                                  <span className="text-xs text-slate-400"> ({row.stats.convertedLeads} conv.)</span>
                                </td>
                                <td className="px-4 py-3">{money(row.stats.salesValue)}</td>
                                <td className="px-4 py-3 font-semibold text-emerald-600">
                                  {money(row.stats.paymentsReceived)}
                                </td>
                                <td className="px-4 py-3 text-rose-600">{money(row.stats.paymentsDue)}</td>
                                <td className="px-4 py-3">
                                  {row.prizesAchieved}/{row.prizesTotal}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                  {row.nextPrize
                                    ? `${row.nextPrize.title} · remaining ${formatMetric(row.nextPrize.metric, row.nextPrize.remaining)}`
                                    : row.prizesTotal
                                      ? "All unlocked"
                                      : "—"}
                                </td>
                              </tr>
                              {expandedId === row.employeeId && (
                                <tr>
                                  <td colSpan={8} className="bg-slate-50 px-4 py-4 dark:bg-slate-950/50">
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                      {row.prizes.length === 0 ? (
                                        <p className="text-sm text-slate-500">No prize rules configured.</p>
                                      ) : (
                                        row.prizes.map((p) => <PrizeCard key={p._id} prize={p} />)
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

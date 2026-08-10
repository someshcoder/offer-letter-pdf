"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchJsonCached, getCachedJson } from "@/lib/clientDataCache";
import { StatCard, StatCardSkeleton } from "@/components/modules/StatCard";

type DashboardStats = {
  cards: Record<string, number>;
  charts: {
    leadsByStatus: { _id: string; count: number }[];
    projectsByStatus: { _id: string; count: number }[];
    expensesByCategory: { _id: string; total: number }[];
    salaryByMonth: { _id: number; total: number }[];
  };
};

const QUICK_LINKS = [
  ["/sales/leads", "Sales Leads"],
  ["/projects", "Projects"],
  ["/payments", "Payments"],
  ["/maintenance", "Maintenance"],
  ["/domains", "Domains"],
  ["/tasks", "Tasks"],
  ["/reports", "Reports"],
] as const;

const KPI_CARDS: {
  key: string;
  title: string;
  icon: "Users" | "UserCircle" | "Briefcase" | "Shield" | "CreditCard" | "Clock" | "FileText" | "TrendingUp";
  color: "blue" | "green" | "indigo" | "red" | "orange";
  money?: boolean;
}[] = [
  { key: "totalCustomers", title: "Total Customers", icon: "Users", color: "blue" },
  { key: "activeCustomers", title: "Active Customers", icon: "UserCircle", color: "green" },
  { key: "activeProjects", title: "Active Projects", icon: "Briefcase", color: "indigo" },
  { key: "completedProjects", title: "Completed Projects", icon: "Shield", color: "green" },
  { key: "monthlyRevenue", title: "Monthly Revenue", icon: "CreditCard", color: "green", money: true },
  { key: "pendingPayments", title: "Pending Payments", icon: "Clock", color: "red" },
  { key: "officeExpenses", title: "Office Expenses", icon: "FileText", color: "orange", money: true },
  { key: "staffExpenses", title: "Staff Expenses", icon: "TrendingUp", color: "orange", money: true },
  { key: "totalLeads", title: "Total Leads", icon: "Users", color: "indigo" },
  { key: "convertedLeads", title: "Closed Leads", icon: "Shield", color: "green" },
  { key: "maintenanceCustomers", title: "Maintenance Active", icon: "Briefcase", color: "orange" },
  { key: "monthlyServices", title: "Monthly Services", icon: "Clock", color: "indigo" },
  { key: "pendingTasks", title: "Pending Tasks", icon: "FileText", color: "orange" },
  { key: "domainExpiry", title: "Domain Expiry (30d)", icon: "Shield", color: "orange" },
];

function formatKpiValue(value: number | undefined, money?: boolean) {
  const n = value ?? 0;
  return money ? `₹${n.toLocaleString()}` : n;
}

export const DashboardInsights = memo(function DashboardInsights() {
  const [stats, setStats] = useState<DashboardStats | null>(() =>
    getCachedJson<DashboardStats>("/api/dashboard/stats") ?? null,
  );

  useEffect(() => {
    let active = true;
    fetchJsonCached<DashboardStats>("/api/dashboard/stats")
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const salaryChart = useMemo(
    () => stats?.charts.salaryByMonth?.map((s) => ({ _id: `Month ${s._id}`, count: s.total })) ?? [],
    [stats?.charts.salaryByMonth],
  );

  const cards = stats?.cards;

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-300">
          Business & Service
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Analytics Overview
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Customers, projects, payments, and operations at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!cards ? (
          <StatCardSkeleton count={8} />
        ) : (
          KPI_CARDS.map((kpi) => (
            <StatCard
              key={kpi.key}
              title={kpi.title}
              value={formatKpiValue(cards[kpi.key] as number | undefined, kpi.money)}
              icon={kpi.icon}
              color={kpi.color}
            />
          ))
        )}
      </div>

      {stats?.charts ? (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Leads by Status" data={stats.charts.leadsByStatus} />
          <ChartCard title="Projects by Status" data={stats.charts.projectsByStatus} />
          <ChartCard title="Office Expenses by Category" data={stats.charts.expensesByCategory} valueKey="total" />
          <ChartCard title="Salary by Month" data={salaryChart} valueKey="count" />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {QUICK_LINKS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold transition-colors hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 sm:px-4 sm:text-sm"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
});

const ChartCard = memo(function ChartCard({
  title,
  data,
  valueKey = "count",
}: {
  title: string;
  data?: { _id: string | number; count?: number; total?: number }[];
  valueKey?: "count" | "total";
}) {
  const items = data || [];
  const max = useMemo(
    () => Math.max(...items.map((d) => (valueKey === "total" ? d.total : d.count) || 0), 1),
    [items, valueKey],
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No data yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((d) => {
            const val = (valueKey === "total" ? d.total : d.count) || 0;
            return (
              <div key={String(d._id)}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="truncate pr-2">{String(d._id)}</span>
                  <span className="shrink-0 tabular-nums">{val.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-cyan-500 transition-[width] duration-300"
                    style={{ width: `${(val / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

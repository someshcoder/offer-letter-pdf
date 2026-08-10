"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { StatusBadge, formSelect } from "@/components/modules/DataTable";

type SessionRow = {
  _id: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  role: string;
  loginAt: string;
  logoutAt?: string | null;
  lastSeenAt: string;
  durationSeconds?: number;
  todaySeconds?: number;
  active: boolean;
};

type Summary = {
  total: number;
  online: number;
  employees: number;
  tls: number;
  todaySeconds: number;
};

export default function LoginSessionsPage() {
  const [items, setItems] = useState<SessionRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, online: 0, employees: 0, tls: 0, todaySeconds: 0 });
  const [role, setRole] = useState("All");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (role !== "All") params.set("role", role);
      const res = await fetch(`/api/login-sessions?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load sessions");
      setItems(data.items || []);
      setSummary(data.summary || { total: 0, online: 0, employees: 0, tls: 0, todaySeconds: 0 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "System" }, { label: "Login Sessions" }]} />

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            Admin Tracking
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Login Sessions</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Today&apos;s login and online time appears here. Daily summary is calculated from session data, not stored separately.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total Sessions" value={summary.total} />
          <StatCard label="Online Now" value={summary.online} />
          <StatCard label="Employee Logins" value={summary.employees} />
          <StatCard label="TL Logins" value={summary.tls} />
          <StatCard label="Today Total Time" value={formatDuration(summary.todaySeconds)} />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900 dark:text-white">Today Login Activity</h2>
            <select className={`${formSelect} max-w-48`} value={role} onChange={(e) => setRole(e.target.value)}>
              {["All", "Employee", "TL", "HR", "Admin"].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Login</th>
                  <th className="px-4 py-3">Last Seen</th>
                  <th className="px-4 py-3">Logout</th>
                  <th className="px-4 py-3">Today Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-6 text-slate-500" colSpan={7}>Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td className="px-4 py-6 text-slate-500" colSpan={7}>No sessions found.</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{item.name || item.email}</p>
                        <p className="text-xs text-slate-500">{item.mobileNumber || item.email || "-"}</p>
                      </td>
                      <td className="px-4 py-3">{item.role}</td>
                      <td className="px-4 py-3">{formatDate(item.loginAt)}</td>
                      <td className="px-4 py-3">{formatDate(item.lastSeenAt)}</td>
                      <td className="px-4 py-3">{item.logoutAt ? formatDate(item.logoutAt) : "-"}</td>
                      <td className="px-4 py-3">{formatDuration(item.todaySeconds || item.durationSeconds || 0)}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.active ? "Online" : "Offline"} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${seconds}s`;
}

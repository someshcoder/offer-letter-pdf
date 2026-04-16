"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Employee } from "@/types/employee";

type EmployeeResponse = { items?: Employee[]; error?: string };

export default function EmployeesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showUnassigned, setShowUnassigned] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = showUnassigned ? "/api/employees?filter=unassigned" : "/api/employees";
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = (await res.json()) as EmployeeResponse;
      if (!res.ok) {
        throw new Error(data.error || "Failed to load employees");
      }
      setItems(data.items || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [router, showUnassigned]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      return (
        item.employeeName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q) ||
        item.accessRole.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const roleStats = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.accessRole] = (acc[item.accessRole] || 0) + 1;
        return acc;
      },
      { Admin: 0, HR: 0, TL: 0, Employee: 0 } as Record<string, number>,
    );
  }, [items]);

  async function onDelete(id: string) {
    if (!window.confirm("Delete this employee?")) return;

    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      window.alert(data.error || "Delete failed");
      return;
    }

    setItems((prev) => prev.filter((item) => item._id !== id));
  }

  return (
    <div className="min-h-screen p-3 sm:p-5 md:p-6 lg:p-7 xl:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5 md:space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70 sm:p-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,0.15),transparent_36%),radial-gradient(circle_at_80%_0%,rgba(20,184,166,0.12),transparent_34%)]"
            aria-hidden
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
                Employee Management
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                Somesh Bhatnagar
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Manage team profiles, roles, and account details.
              </p>
            </div>
            <Link
              href="/employees/new"
              className="relative z-10 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-700/20 hover:bg-cyan-500"
            >
              Add Employee
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Total Employees" value={items.length} />
          <KpiCard label="Admin" value={roleStats.Admin} />
          <KpiCard label="HR" value={roleStats.HR} />
          <KpiCard label="TL" value={roleStats.TL} />
          <KpiCard label="Employee" value={roleStats.Employee} />
        </section>

        <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role, email..."
            className="flex-1 min-w-[200px] rounded-xl border border-slate-300/80 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-800"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showUnassigned}
              onChange={(e) => setShowUnassigned(e.target.checked)}
              className="size-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Only Show Unassigned
            </span>
          </label>
        </section>

        {loading ? <p className="text-sm text-slate-600 dark:text-slate-300">Loading employees...</p> : null}
        {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}

        {!loading && !error ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="w-full overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-xs sm:text-sm md:text-base">
              <thead className="bg-slate-100/90 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Designation</th>
                  <th className="px-3 py-2">Access Role</th>
                  <th className="px-3 py-2">Reporting TL</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t border-slate-200 transition hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{item.employeeName}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 break-all">{item.email}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{item.designation}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                        {item.accessRole}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {item.reportingTL?.employeeName ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.reportingTL.employeeName}
                          </span>
                          <span className="text-[10px] text-slate-500">{item.reportingTL.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/employees/${item._id}/view`}
                          className="rounded-md border border-cyan-300 px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50 dark:border-cyan-600 dark:text-cyan-300 dark:hover:bg-cyan-950/20"
                        >
                          View
                        </Link>
                        <Link
                          href={`/employees/${item._id}/edit`}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(item._id)}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/20"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Users,
  UserCheck,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  UserMinus,
  Shield,
} from "lucide-react";
import type { Employee } from "@/types/employee";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { btnPrimary } from "@/components/ui/FormUi";
import { membersForTl } from "@/lib/tlAssignment";
import { moduleBreadcrumbs } from "@/lib/navigation";
import { fetchJsonCached, getCachedJson } from "@/lib/clientDataCache";

type Manager = {
  id: string;
  name: string;
  role: string;
  email: string;
  mobileNumber?: string;
};

type ManagerResponse = { items?: Manager[]; error?: string; warning?: string };
type EmployeeResponse = { items?: Employee[]; error?: string; warning?: string };

const mod = { route: "/tls", title: "TL Management", section: "People & HR" };

export default function TeamLeaderManagementPage() {
  const router = useRouter();
  const [tls, setTls] = useState<Manager[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [unassigned, setUnassigned] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTlId, setSelectedTlId] = useState<string>("");
  const [expandedTlId, setExpandedTlId] = useState<string | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const cachedAll = getCachedJson<EmployeeResponse>("/api/employees?lite=1");
    const cachedManagers = getCachedJson<ManagerResponse>("/api/employees/managers");
    if (cachedAll?.items && cachedManagers?.items) {
      const tlList = (cachedManagers.items || []).filter((m) => m.role === "TL");
      setTls(tlList);
      setAllEmployees((cachedAll.items || []).filter((e) => e.accessRole === "Employee"));
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [managersData, allData, poolData] = await Promise.all([
        fetchJsonCached<ManagerResponse>("/api/employees/managers"),
        fetchJsonCached<EmployeeResponse>("/api/employees?lite=1"),
        fetchJsonCached<EmployeeResponse>("/api/employees?filter=unassigned&lite=1"),
      ]);
      const tlList = (managersData.items || []).filter((m) => m.role === "TL");
      setTls(tlList);
      setAllEmployees((allData.items || []).filter((e) => e.accessRole === "Employee"));
      setUnassigned(poolData.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const membersByTl = useMemo(() => {
    const map: Record<string, Employee[]> = {};
    for (const tl of tls) {
      map[tl.id] = membersForTl(allEmployees, tl.id);
    }
    return map;
  }, [allEmployees, tls]);

  const selectedTl = useMemo(
    () => tls.find((t) => t.id === selectedTlId) ?? null,
    [tls, selectedTlId],
  );

  const openTl = useMemo(
    () => tls.find((t) => t.id === expandedTlId) ?? null,
    [tls, expandedTlId],
  );

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectTl = (tlId: string) => {
    setSelectedTlId(tlId);
    setExpandedTlId(tlId);
  };

  const handleAssign = async () => {
    if (!selectedTlId || selectedEmployeeIds.length === 0) {
      toast.error("Select a TL first, then choose employees");
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch("/api/tls/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tlId: selectedTlId, employeeIds: selectedEmployeeIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assign failed");

      toast.success(
        `${selectedEmployeeIds.length} employee(s) added to ${selectedTl?.name}'s team`,
      );
      setSelectedEmployeeIds([]);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (employeeId: string, employeeName: string) => {
    setUnassigningId(employeeId);
    try {
      const res = await fetch("/api/tls/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unassign failed");

      toast.success(`${employeeName} moved back to the unassigned pool`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unassign failed");
    } finally {
      setUnassigningId(null);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb items={moduleBreadcrumbs(mod.route)} />

        <header className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            People & HR
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">TL Management</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Team Leaders on the left. Unassigned employees on the right. Once assigned, the employee moves under the TL and leaves the pool.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* LEFT — Team Leaders + their members when opened */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-indigo-500" />
                <h2 className="font-bold text-slate-900 dark:text-white">Team Leaders</h2>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                {tls.length} TL
              </span>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-3 custom-scrollbar">
              {loading ? (
                <TableSkeleton columns={1} rows={4} />
              ) : tls.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  No TL found. Set an employee's access role to TL first.
                </p>
              ) : (
                <ul className="space-y-2">
                  {tls.map((tl) => {
                    const members = membersByTl[tl.id] || [];
                    const isSelected = selectedTlId === tl.id;
                    const isExpanded = expandedTlId === tl.id;

                    return (
                      <li
                        key={tl.id}
                        className={`overflow-hidden rounded-xl border transition-colors ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-50/40 dark:border-cyan-600 dark:bg-cyan-950/20"
                            : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectTl(tl.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left"
                        >
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                            {tl.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-900 dark:text-white">
                              {tl.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">{tl.email}</p>
                          </div>
                          <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                            {members.length} members
                          </span>
                          <ChevronDown
                            className={`size-4 shrink-0 text-slate-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="border-t border-slate-200/80 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {tl.name}&apos;s employees
                            </p>
                            {members.length === 0 ? (
                              <p className="px-2 py-4 text-center text-xs text-slate-500">
                                No employees assigned yet
                              </p>
                            ) : (
                              <ul className="space-y-1.5">
                                {members.map((member) => (
                                  <li
                                    key={member._id}
                                    className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                        {member.employeeName}
                                      </p>
                                      <p className="truncate text-[10px] text-slate-500">
                                        {member.designation}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      title="Remove from TL"
                                      disabled={unassigningId === member._id}
                                      onClick={() =>
                                        handleUnassign(member._id, member.employeeName)
                                      }
                                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                                    >
                                      <UserMinus className="size-3" />
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* RIGHT — Unassigned employees only */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-cyan-600" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Unassigned Employees</h2>
                  <p className="text-xs text-slate-500">
                    {selectedTl
                      ? `Assign to: ${selectedTl.name}`
                      : "Select a TL from the left first"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedTlId || selectedEmployeeIds.length === 0 || assigning}
                className={`${btnPrimary} shrink-0`}
              >
                {assigning ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <UserCheck className="size-4" />
                    Assign
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-3 custom-scrollbar">
              {loading ? (
                <TableSkeleton columns={1} rows={5} />
              ) : unassigned.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="size-10 text-slate-300 dark:text-slate-700" />
                  <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    All employees are assigned to a TL
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add a new employee or remove one from a TL to bring them back here
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {unassigned.map((employee) => {
                    const picked = selectedEmployeeIds.includes(employee._id);
                    return (
                      <li key={employee._id}>
                        <button
                          type="button"
                          onClick={() => toggleEmployee(employee._id)}
                          disabled={!selectedTlId}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                            !selectedTlId
                              ? "cursor-not-allowed opacity-60"
                              : picked
                                ? "border-cyan-500 bg-cyan-50/60 dark:border-cyan-600 dark:bg-cyan-950/30"
                                : "border-slate-200 bg-white hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-950/30"
                          }`}
                        >
                          <div
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              picked
                                ? "border-cyan-500 bg-cyan-500"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {picked && <div className="size-2 rounded-full bg-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {employee.employeeName}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {employee.designation} · {employee.email}
                            </p>
                          </div>
                          {selectedTlId && (
                            <ChevronRight className="size-4 shrink-0 text-slate-400" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {selectedEmployeeIds.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">
                {selectedEmployeeIds.length} selected — click Assign to add them to the TL&apos;s team
              </div>
            )}
          </section>
        </div>

        {/* Quick view when TL opened — summary bar */}
        {openTl && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3 text-sm dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">
              {openTl.name}
            </span>
            <span className="text-indigo-700 dark:text-indigo-300">
              {" "}
              — {(membersByTl[openTl.id] || []).length} employee(s) assigned. Only unassigned employees appear on the right.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Employee } from "@/types/employee";

type Manager = {
  id: string;
  name: string;
  role: string;
  email: string;
};

type ManagerResponse = { items?: Manager[]; warning?: string; error?: string };
type EmployeeResponse = { items?: Employee[]; warning?: string; error?: string };

export default function TeamLeaderManagementPage() {
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTl, setSelectedTl] = useState(""
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expandedTlId, setExpandedTlId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [managersRes, employeesRes] = await Promise.all([
        fetch("/api/employees/managers", { cache: "no-store" }),
        fetch("/api/employees", { cache: "no-store" }),
      ]);

      if (managersRes.status === 401 || employeesRes.status === 401) {
        router.replace("/login");
        return;
      }

      const managersData = (await managersRes.json()) as ManagerResponse;
      const employeesData = (await employeesRes.json()) as EmployeeResponse;

      if (!managersRes.ok) {
        throw new Error(managersData.error || managersData.warning || "Failed to load TLs");
      }
      if (!employeesRes.ok) {
        throw new Error(employeesData.error || employeesData.warning || "Failed to load employees");
      }

      setManagers(
        (managersData.items || []).filter((item) => item.role === "TL"),
      );
      setEmployees((employeesData.items || []).filter((item) => item.accessRole === "Employee"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load TL management data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedTlName = useMemo(
    () => managers.find((m) => m.id === selectedTl)?.name || "",
    [managers, selectedTl],
  );

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const availableEmployees = useMemo(() => {
    if (!selectedTl) {
      return employees;
    }
    return employees;
  }, [employees, selectedTl]);

  async function handleCreateTl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/tls/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to create TL account");
        return;
      }

      setName("");
      setEmail("");
      setPassword("");
      setMessage("Team Leader account created successfully.");
      await loadData();
    } catch {
      setMessage("Unable to create Team Leader account.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAssign() {
    if (!selectedTl || selectedEmployeeIds.length === 0) return;
    setAssigning(true);
    setMessage(null);

    try {
      const res = await fetch("/api/tls/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tlId: selectedTl, employeeIds: selectedEmployeeIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to assign employees");
        return;
      }

      setSelectedEmployeeIds([]);
      setMessage(`Assigned ${selectedEmployeeIds.length} employee(s) to ${selectedTlName}.`);
      await loadData();
    } catch {
      setMessage("Unable to assign employees to TL.");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
            Admin / TL Setup
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Team Leader Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Create team leader accounts, assign employees, and keep team structure organized.
          </p>
        </header>

        {message ? (
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 dark:border-cyan-700/50 dark:bg-cyan-950/60 dark:text-cyan-200">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-700/50 dark:bg-red-950/60 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Team Leader</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Create a new TL account for the team. This account can later be assigned employees.
            </p>
            <form className="mt-6 space-y-5" onSubmit={handleCreateTl}>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Mohit Kumar"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="mohit@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-300"
              >
                {creating ? "Creating TL…" : "Create Team Leader"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assign employees</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Select a team leader and assign employees to the group.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Team Leader</label>
                <select
                  value={selectedTl}
                  onChange={(e) => setSelectedTl(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">— Select TL —</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} — {manager.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employees</label>
                <div className="mt-2 min-h-[140px] rounded-2xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  {loading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading employees...</p>
                  ) : availableEmployees.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No employees available.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableEmployees.map((employee) => (
                        <label key={employee._id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-cyan-500">
                          <input
                            type="checkbox"
                            checked={selectedEmployeeIds.includes(employee._id)}
                            onChange={() => toggleEmployeeSelection(employee._id)}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className="text-sm font-medium">{employee.employeeName}</span>
                          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{employee.email}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedTl || selectedEmployeeIds.length === 0 || assigning}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-cyan-300"
              >
                {assigning ? "Assigning…" : `Assign ${selectedEmployeeIds.length || "No"} employee(s)`}
              </button>
            </div>
          </section>
        </div>

        {/* ── Team Leader List Section ── */}
        <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Team Leaders</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Manage and view all registered team leaders in the system.
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
              <span className="font-bold text-lg">{managers.length}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-500">Loading managers...</div>
            ) : managers.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 dark:bg-slate-800">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-slate-900 font-medium dark:text-white">No Team Leaders Found</h3>
                <p className="text-slate-500 text-sm">Please create a new Team Leader above.</p>
              </div>
            ) : (
              managers.map((manager) => {
                const isExpanded = expandedTlId === manager.id;
                const members = employees.filter((e) => e.reportingTL?.id === manager.id);

                return (
                  <div key={manager.id} className="col-span-full">
                    <div className={`group relative flex items-center gap-4 rounded-2xl border transition-all ${isExpanded ? "border-violet-500 bg-violet-50/30 dark:border-violet-400 dark:bg-violet-900/20" : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-violet-500/50"} p-4`}>
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-violet-500/30 transition group-hover:scale-105">
                        {manager.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">{manager.name}</h3>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400 font-medium">{manager.email}</p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-lg bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 ring-1 ring-inset ring-violet-700/10 dark:bg-violet-400/10 dark:text-violet-400 dark:ring-violet-400/20">
                            {manager.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">•</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                            {members.length} Members
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedTlId(isExpanded ? null : manager.id)}
                        className={`flex size-10 items-center justify-center rounded-xl border transition-all ${isExpanded ? "bg-violet-600 text-white border-violet-600 rotate-180" : "bg-white text-slate-400 border-slate-200 hover:border-violet-400 hover:text-violet-600 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-violet-500"}`}
                      >
                        {isExpanded ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Member List Transition Overlay */}
                    {isExpanded && (
                      <div className="mt-2 ml-10 space-y-2 border-l-2 border-dashed border-violet-200 pl-6 pr-2 animate-in slide-in-from-top-2 duration-300 dark:border-violet-800/50">
                        {members.length === 0 ? (
                          <p className="py-2 text-xs text-slate-400 italic">No team members assigned yet.</p>
                        ) : (
                          members.map((member) => (
                            <div key={member._id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 border border-slate-100 shadow-sm transition hover:border-cyan-200 dark:bg-slate-800/40 dark:border-slate-800/50 dark:hover:border-cyan-500/50">
                              <div className="size-2 rounded-full bg-cyan-500"></div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{member.employeeName}</p>
                                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{member.email}</p>
                              </div>
                              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-0.5 rounded-md">
                                {member.designation}
                              </span>
                            </div>
                          ))
                        )}
                        <div className="h-2"></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { fetchJsonCached, getCachedJson, invalidateCachedUrl } from "@/lib/clientDataCache";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { StatusBadge, btnPrimary, btnSecondary, formInput, formSelect, formTextarea } from "@/components/modules/DataTable";

type TeamMember = {
  _id: string;
  employeeName: string;
  email: string;
  mobileNumber: string;
  designation?: string;
};

type TaskRow = {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  progress?: number;
  assignedStaffIds?: string[];
  assignedStaffNames?: string[];
  employeeRemark?: string;
  estimatedTime?: string;
  actualTime?: string;
};

export default function TlDashboardPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    assignedStaffId: "",
  });

  const load = useCallback(async () => {
    const url = "/api/tl-dashboard";
    const cached = getCachedJson<{ team?: TeamMember[]; tasks?: TaskRow[] }>(url);
    if (cached) {
      setTeam(cached.team || []);
      setTasks(cached.tasks || []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const data = await fetchJsonCached<{ team?: TeamMember[]; tasks?: TaskRow[] }>(url);
      setTeam(data.team || []);
      setTasks(data.tasks || []);
      setForm((prev) => ({
        ...prev,
        assignedStaffId: prev.assignedStaffId || data.team?.[0]?._id || "",
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const employeeTaskCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      for (const id of task.assignedStaffIds || []) {
        counts.set(id, (counts.get(id) || 0) + 1);
      }
    }
    return counts;
  }, [tasks]);

  async function assignTask() {
    const employee = team.find((member) => member._id === form.assignedStaffId);
    if (!employee) {
      toast.error("Select employee");
      return;
    }

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: "Pending",
        dueDate: form.dueDate || null,
        progress: 0,
        assignedStaffIds: [employee._id],
        assignedStaffNames: [employee.employeeName],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Task assign failed");
      return;
    }
    toast.success("Task assigned");
    setForm((prev) => ({ ...prev, title: "", description: "", dueDate: "" }));
    invalidateCachedUrl("/api/tl-dashboard");
    invalidateCachedUrl("/api/tasks");
    load();
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb items={[{ label: "Dashboard", href: "/tl-dashboard" }, { label: "TL Dashboard" }]} />

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            Team Leader Portal
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">TL Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            View employees under you, assign tasks, and track progress and remarks.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-slate-900 dark:text-white">My Team</h2>
            <p className="mt-1 text-xs text-slate-500">These employees are assigned under your TL role.</p>
            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="text-sm text-slate-500">Loading team...</p>
              ) : team.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950/50">
                  No employees assigned under you yet.
                </p>
              ) : (
                team.map((member) => (
                  <div key={member._id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{member.employeeName}</p>
                        <p className="text-xs text-slate-500">{member.designation || "Employee"} · {member.mobileNumber}</p>
                      </div>
                      <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                        {employeeTaskCount.get(member._id) || 0} tasks
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-slate-900 dark:text-white">Assign Task</h2>
            <p className="mt-1 text-xs text-slate-500">Once assigned, tasks appear on the employee dashboard and in notifications.</p>
            <div className="mt-4 grid gap-3">
              <select className={formSelect} value={form.assignedStaffId} onChange={(e) => setForm((p) => ({ ...p, assignedStaffId: e.target.value }))}>
                <option value="">Select employee</option>
                {team.map((member) => <option key={member._id} value={member._id}>{member.employeeName}</option>)}
              </select>
              <input className={formInput} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Task title" />
              <textarea className={formTextarea} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Task details" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className={formSelect} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                  {["Low", "Medium", "High", "Urgent"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
                <input className={formInput} type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setForm((p) => ({ ...p, title: "", description: "", dueDate: "" }))} className={btnSecondary}>Clear</button>
                <button type="button" onClick={assignTask} className={btnPrimary}>Assign Task</button>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-slate-900 dark:text-white">Team Task Updates</h2>
          <div className="mt-4 grid gap-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No team task yet.</p>
            ) : (
              tasks.map((task) => (
                <article key={task._id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Assigned: {(task.assignedStaffNames || []).join(", ") || "Team member"}
                      </p>
                    </div>
                    <StatusBadge status={task.status || "Pending"} />
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-4">
                    <p>Progress: <b>{task.progress || 0}%</b></p>
                    <p>Priority: <b>{task.priority || "Medium"}</b></p>
                    <p>ETA: <b>{task.estimatedTime || "Not added"}</b></p>
                    <p>Actual: <b>{task.actualTime || "Not added"}</b></p>
                  </div>
                  {task.employeeRemark ? (
                    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
                      {task.employeeRemark}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

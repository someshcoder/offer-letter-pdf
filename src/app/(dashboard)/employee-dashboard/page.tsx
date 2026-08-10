"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchJsonCached, getCachedJson, invalidateCachedUrl } from "@/lib/clientDataCache";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { StatusBadge, btnPrimary, btnSecondary, formInput, formSelect, formTextarea } from "@/components/modules/DataTable";

type TaskRow = {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  progress?: number;
  dueDate?: string;
  employeeRemark?: string;
  estimatedTime?: string;
  actualTime?: string;
};

const statusOptions = ["Pending", "In Progress", "Completed"];

export default function EmployeeDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const employeeId = searchParams?.get("employeeId") || "";

  const [session, setSession] = useState<{ role?: string; userId?: string } | null>(null);
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [onlineSeconds, setOnlineSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [form, setForm] = useState({
    status: "In Progress",
    progress: "50",
    employeeRemark: "",
    estimatedTime: "",
    actualTime: "",
  });

  const loadTasks = useCallback(async () => {
    let url = "/api/tasks?limit=100";
    if (employeeId) url += `&staffId=${employeeId}`;
    const cached = getCachedJson<{ items?: TaskRow[] }>(url);
    if (cached?.items) {
      setTasks(cached.items);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const data = await fetchJsonCached<{ items?: TaskRow[] }>(url);
      setTasks(data.items || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOnline = useCallback(async () => {
    try {
      const data = await fetchJsonCached<{ totalSeconds?: number }>("/api/auth/online-today");
      setOnlineSeconds(data.totalSeconds || 0);
    } catch {
      // ignore background refresh errors
    }
  }, []);

  useEffect(() => {
    // Fetch session role
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
        if (data?.role === "Admin" || data?.role === "HR") {
          fetch("/api/employees?lite=1")
            .then((r) => r.json())
            .then((emps) => {
              if (emps.items) {
                setEmployees(emps.items.map((e: any) => ({ _id: e._id, name: e.name })));
              }
            });
        }
      });
  }, []);

  useEffect(() => {
    loadTasks();
    if (!employeeId) {
      loadOnline();
      const onlineInterval = window.setInterval(loadOnline, 60_000);
      return () => window.clearInterval(onlineInterval);
    }
  }, [loadTasks, loadOnline, employeeId]);

  function openUpdate(task: TaskRow) {
    setEditing(task);
    setForm({
      status: task.status || "In Progress",
      progress: String(task.progress ?? 50),
      employeeRemark: task.employeeRemark || "",
      estimatedTime: task.estimatedTime || "",
      actualTime: task.actualTime || "",
    });
  }

  async function saveUpdate() {
    if (!editing) return;
    const res = await fetch(`/api/tasks?id=${editing._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        progress: Number(form.progress || 0),
        employeeRemark: form.employeeRemark,
        estimatedTime: form.estimatedTime,
        actualTime: form.actualTime,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Update failed");
      return;
    }
    toast.success("Task updated");
    setEditing(null);
    invalidateCachedUrl("/api/tasks");
    loadTasks();
  }

  const pending = tasks.filter((task) => task.status !== "Completed").length;
  const completed = tasks.filter((task) => task.status === "Completed").length;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Breadcrumb items={[{ label: "Dashboard", href: "/employee-dashboard" }, { label: employeeId ? "Employee Dashboard" : "My Dashboard" }]} />
          
          {(session?.role === "Admin" || session?.role === "HR") && (
            <select 
              className={formSelect + " sm:w-64"}
              value={employeeId}
              onChange={(e) => {
                const val = e.target.value;
                if (val) router.push(`/employee-dashboard?employeeId=${val}`);
                else router.push(`/employee-dashboard`);
              }}
            >
              <option value="">Select an Employee...</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          )}
        </div>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            Employee Portal
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {employeeId ? `${employees.find(e => e._id === employeeId)?.name || 'Employee'}'s Dashboard` : "My Tasks"}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Tasks assigned by Admin or TL appear here. You can update status, remarks, and time.
          </p>
          {!employeeId && (
            <Link
              href="/sales/dashboard"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              Open Sales Dashboard — prizes, payments & sales
            </Link>
          )}
        </header>

        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total Tasks" value={tasks.length} />
          <StatCard label="Pending / Progress" value={pending} />
          <StatCard label="Completed" value={completed} />
          <StatCard label="Today Online" value={formatDuration(onlineSeconds)} />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-slate-900 dark:text-white">No task assigned</h2>
            <p className="mt-1 text-sm text-slate-500">When Admin or TL assigns a task, it will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tasks.map((task) => (
              <article key={task._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white">{task.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{task.description || "No description"}</p>
                  </div>
                  <StatusBadge status={task.status || "Pending"} />
                </div>
                <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <p>Priority: <span className="font-semibold">{task.priority || "Medium"}</span></p>
                  <p>Progress: <span className="font-semibold">{task.progress || 0}%</span></p>
                  <p>Due: <span className="font-semibold">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span></p>
                  <p>ETA: <span className="font-semibold">{task.estimatedTime || "Not added"}</span></p>
                </div>
                {task.employeeRemark ? (
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
                    {task.employeeRemark}
                  </p>
                ) : null}
                <button type="button" onClick={() => openUpdate(task)} className={`${btnPrimary} mt-4`}>
                  Update Task
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl mt-6">
        <SalesWidget employeeId={employeeId} />
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Update Task</h2>
            <p className="mt-1 text-sm text-slate-500">{editing.title}</p>
            <div className="mt-5 space-y-4">
              <select className={formSelect} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <input className={formInput} type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm((p) => ({ ...p, progress: e.target.value }))} placeholder="Progress %" />
              <input className={formInput} value={form.estimatedTime} onChange={(e) => setForm((p) => ({ ...p, estimatedTime: e.target.value }))} placeholder="Estimated time, e.g. 2 hours / 1 day" />
              <input className={formInput} value={form.actualTime} onChange={(e) => setForm((p) => ({ ...p, actualTime: e.target.value }))} placeholder="Actual time spent" />
              <textarea className={formTextarea} value={form.employeeRemark} onChange={(e) => setForm((p) => ({ ...p, employeeRemark: e.target.value }))} placeholder="Remark / progress note" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className={btnSecondary}>Cancel</button>
              <button type="button" onClick={saveUpdate} className={btnPrimary}>Save Update</button>
            </div>
          </div>
        </div>
      ) : null}
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

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${seconds}s`;
}

function SalesWidget({ employeeId }: { employeeId: string }) {
  const [data, setData] = useState<{ leads: number, converted: number, active: number } | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    async function loadSales() {
      try {
        let leadsUrl = "/api/sales/leads?limit=1000";
        let clientsUrl = "/api/clients?limit=1000";
        if (employeeId) {
          leadsUrl += `&assignedTo=${employeeId}`;
          clientsUrl += `&staffId=${employeeId}`;
        }

        const [leadsRes, clientsRes] = await Promise.all([
          fetch(leadsUrl),
          fetch(clientsUrl)
        ]);
        
        if (!leadsRes.ok || !clientsRes.ok) {
          console.error("SalesWidget permission denied:", await leadsRes.text(), await clientsRes.text());
          return; // Silent fail if no permission
        }
        
        const leadsData = await leadsRes.json();
        const clientsData = await clientsRes.json();
        
        if (leadsData.items || clientsData.items) {
          const leads = leadsData.items || [];
          setData({
            leads: leads.length,
            converted: leads.filter((l: any) => l.status === "Closed").length,
            active: leads.filter((l: any) => l.status !== "Closed" && l.status !== "Archived").length,
          });
          setClients(clientsData.items || []);
        } else {
          console.error("SalesWidget no items in response:", leadsData, clientsData);
        }
      } catch (err) {
        console.error("SalesWidget error:", err);
      }
    }
    loadSales();
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Sales Activity</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Leads Assigned" value={data.leads} />
        <StatCard label="Active Leads" value={data.active} />
        <StatCard label="Converted Customers" value={data.converted} />
      </div>
      <div className="flex flex-wrap gap-4">
        <a href="/sales/leads" className={btnPrimary}>Go to Leads Dashboard</a>
        <a href="/clients" className={btnSecondary}>View My Customers</a>
        <button type="button" onClick={() => setShowPaymentModal(true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400">
          Record Payment
        </button>
      </div>

      {showPaymentModal && (
        <RecordPaymentModal
          clients={clients}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}

function RecordPaymentModal({ clients, onClose }: { clients: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    clientId: clients[0]?._id || "",
    totalAmount: "",
    paidAmount: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function submitPayment() {
    if (!form.clientId || !form.totalAmount || !form.paidAmount) return alert("Fill required fields");
    setSaving(true);
    try {
      const res = await fetch("/api/sales/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          totalAmount: Number(form.totalAmount),
          paidAmount: Number(form.paidAmount),
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Payment recorded successfully!");
      onClose();
    } catch (err: any) {
      alert("Failed to record payment: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Customer Payment</h2>
        <p className="mt-1 text-sm text-slate-500">Log a payment for a customer you brought in.</p>
        
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Customer</label>
            <select
              className={formSelect}
              value={form.clientId}
              onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
            >
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.name} {c.company ? `(${c.company})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Total Invoice Amount (₹)</label>
              <input
                type="number"
                className={formInput}
                value={form.totalAmount}
                onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))}
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Amount Collected Now (₹)</label>
              <input
                type="number"
                className={formInput}
                value={form.paidAmount}
                onChange={(e) => setForm((p) => ({ ...p, paidAmount: e.target.value }))}
                placeholder="e.g. 10000"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Notes / Reference</label>
            <input
              type="text"
              className={formInput}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Cheque #, transaction ID, advance for XYZ"
            />
          </div>
        </div>
        
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={btnSecondary}>Cancel</button>
          <button type="button" onClick={submitPayment} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60">
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

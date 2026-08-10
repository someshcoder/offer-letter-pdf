"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { btnPrimary, btnSecondary, formInput, formSelect, formTextarea } from "@/components/modules/DataTable";

// Client-safe metric labels
const METRIC_OPTIONS = [
  { value: "customers", label: "Customers closed" },
  { value: "leads", label: "Leads created" },
  { value: "converted_leads", label: "Leads converted" },
  { value: "sales_value", label: "Total sales value (₹)" },
  { value: "payments_received", label: "Payment received (₹)" },
] as const;

type Prize = {
  _id: string;
  title: string;
  description?: string;
  reward: string;
  metric: string;
  targetValue: number;
  period: string;
  sortOrder?: number;
  isActive?: boolean;
};

const emptyForm = {
  title: "",
  description: "",
  reward: "",
  metric: "payments_received",
  targetValue: "",
  period: "all_time",
  sortOrder: "0",
};

export default function SalesPrizesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "Admin" || user?.role === "HR";
  const [items, setItems] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales/prizes", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load prizes");
      setItems(data.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(prize: Prize) {
    setEditingId(prize._id);
    setForm({
      title: prize.title,
      description: prize.description || "",
      reward: prize.reward,
      metric: prize.metric,
      targetValue: String(prize.targetValue),
      period: prize.period || "all_time",
      sortOrder: String(prize.sortOrder ?? 0),
    });
    setShowForm(true);
  }

  async function savePrize(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    if (!form.title.trim() || !form.reward.trim() || !form.targetValue) {
      toast.error("Title, reward and target are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        reward: form.reward.trim(),
        metric: form.metric,
        targetValue: Number(form.targetValue),
        period: form.period,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: true,
      };
      const res = await fetch(editingId ? `/api/sales/prizes/${editingId}` : "/api/sales/prizes", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(editingId ? "Prize updated" : "Prize created");
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removePrize(id: string) {
    if (!canManage) return;
    if (!confirm("Delete this prize rule?")) return;
    const res = await fetch(`/api/sales/prizes/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Delete failed");
      return;
    }
    toast.success("Prize deleted");
    load();
  }

  if (user && !canManage) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-sm text-slate-500">Only Admin/HR can manage sales prizes.</p>
        <Link href="/sales/dashboard" className="mt-3 inline-block text-cyan-600 underline">
          Go to Sales Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Sales & Customers" },
            { label: "Sales Prizes" },
          ]}
        />

        <header className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-600">Admin · Sales</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Sales Prize Rules</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Set dynamic targets and rewards. Example: if payment received reaches ₹1,00,000 give a bonus gift.
                Employees see progress on their Sales Dashboard automatically.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/sales/dashboard" className={btnSecondary}>
                Team performance
              </Link>
              <button type="button" onClick={openCreate} className={btnPrimary}>
                + Add Prize
              </button>
            </div>
          </div>
        </header>

        {showForm && (
          <form
            onSubmit={savePrize}
            className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 dark:border-cyan-900 dark:bg-cyan-950/20"
          >
            <h2 className="mb-4 font-bold text-slate-900 dark:text-white">
              {editingId ? "Edit prize" : "New prize rule"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Prize title</span>
                <input className={formInput} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Gold Prize / Level 1" required />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Reward (what they get)</span>
                <input className={formInput} value={form.reward} onChange={(e) => setForm((p) => ({ ...p, reward: e.target.value }))} placeholder="₹5,000 bonus / Gift voucher / Trip" required />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Metric</span>
                <select className={formSelect} value={form.metric} onChange={(e) => setForm((p) => ({ ...p, metric: e.target.value }))}>
                  {METRIC_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Target value</span>
                <input className={formInput} type="number" min={0} value={form.targetValue} onChange={(e) => setForm((p) => ({ ...p, targetValue: e.target.value }))} placeholder="100000" required />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Period</span>
                <select className={formSelect} value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}>
                  <option value="all_time">All time</option>
                  <option value="monthly">This month only</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Sort order</span>
                <input className={formInput} type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Description (optional)</span>
                <textarea className={formTextarea} rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Reach this target to unlock the reward" />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
              <button type="button" className={btnSecondary} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading prizes…</p>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No prize rules yet. Add the first one so sales employees can track rewards.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((prize) => (
                <li key={prize._id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">{prize.title}</h3>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {prize.period === "monthly" ? "Monthly" : "All time"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Metric:{" "}
                      <span className="font-semibold">
                        {METRIC_OPTIONS.find((m) => m.value === prize.metric)?.label || prize.metric}
                      </span>{" "}
                      · Target:{" "}
                      <span className="font-semibold">
                        {prize.metric.includes("value") || prize.metric.includes("payment")
                          ? `₹${prize.targetValue.toLocaleString()}`
                          : prize.targetValue}
                      </span>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                      Reward: {prize.reward}
                    </p>
                    {prize.description ? (
                      <p className="mt-1 text-xs text-slate-500">{prize.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" className={btnSecondary} onClick={() => openEdit(prize)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                      onClick={() => removePrize(prize._id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

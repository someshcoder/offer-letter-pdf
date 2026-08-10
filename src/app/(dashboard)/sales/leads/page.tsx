"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fetchJsonCached, invalidateCachedUrl } from "@/lib/clientDataCache";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/types/modules/constants";
import { LeadBoard, type LeadBoardItem } from "@/components/modules/sales/LeadBoard";
import { LeadDetailPanel } from "@/components/modules/sales/LeadDetailPanel";
import {
  btnPrimary,
  btnSecondary,
  formInput,
  formSelect,
  formTextarea,
} from "@/components/modules/DataTable";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const mod = MODULE_REGISTRY.leads;

type Lead = LeadBoardItem;

type ViewMode = "list" | "board";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  company: "",
  source: "Website",
  status: "New",
  expectedValue: "",
  assignedTo: "",
  notes: "",
};

const PAGE_SIZE = 25;

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      invalidateCachedUrl("/api/sales/leads");
      const data = await fetchJsonCached<{ items: Lead[] }>("/api/sales/leads?limit=1000", {
        force: true,
      });
      setLeads(data.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
    fetch("/api/employees?lite=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setEmployees(
            data.items.map((e: { _id: string; name?: string; employeeName?: string }) => ({
              value: e._id,
              label: e.employeeName || e.name || "Employee",
            })),
          );
        }
      })
      .catch(() => {});
  }, [loadLeads]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "All" && lead.status !== statusFilter) return false;
      if (sourceFilter !== "All" && lead.source !== sourceFilter) return false;
      if (!q) return true;
      const hay = [lead.name, lead.phone, lead.email, lead.company, lead.assignedToName, lead.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, debouncedSearch, statusFilter, sourceFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sourceFilter, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    if (view === "board") return filtered;
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage, view]);

  const stats = useMemo(() => {
    const open = leads.filter((l) => l.status !== "Closed" && l.status !== "Cancelled" && l.status !== "Archived").length;
    const closed = leads.filter((l) => l.status === "Closed").length;
    const value = leads.reduce((s, l) => s + (Number(l.expectedValue) || 0), 0);
    return { total: leads.length, open, closed, value, shown: filtered.length };
  }, [leads, filtered.length]);

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error("Name and Phone are required");

    try {
      const res = await fetch("/api/sales/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedValue: form.expectedValue ? Number(form.expectedValue) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead");

      toast.success("Lead created successfully");
      setShowNewModal(false);
      setForm(EMPTY_FORM);
      loadLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function quickStatusChange(leadId: string, status: string) {
    setSavingStatusId(leadId);
    try {
      const res = await fetch(`/api/sales/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");
      setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, status } : l)));
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingStatusId(null);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Breadcrumb items={moduleBreadcrumbs(mod.route)} />
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{mod.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Search, filter, and manage high lead volume. Open a row for follow-ups and convert.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadLeads} className={btnSecondary}>
              Refresh
            </button>
            <button type="button" onClick={() => setShowNewModal(true)} className={btnPrimary}>
              + New Lead
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total leads" value={String(stats.total)} />
          <Stat label="Open pipeline" value={String(stats.open)} />
          <Stat label="Closed" value={String(stats.closed)} />
          <Stat label="Pipeline value" value={`₹${stats.value.toLocaleString()}`} />
        </div>

        {/* Filters + view toggle */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm sm:col-span-2 lg:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Search</span>
                <input
                  className={formInput}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, phone, company, email..."
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Status</span>
                <select className={formSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All statuses</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Source</span>
                <select className={formSelect} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                  <option value="All">All sources</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{stats.shown} shown</span>
              <div className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    view === "list"
                      ? "bg-cyan-600 text-white"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setView("board")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    view === "board"
                      ? "bg-cyan-600 text-white"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  Board
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading leads…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-200">No leads match</p>
              <p className="mt-1 text-sm text-slate-500">
                {leads.length === 0 ? "Create your first lead to get started." : "Try clearing search or filters."}
              </p>
              {leads.length === 0 && (
                <button type="button" onClick={() => setShowNewModal(true)} className={`${btnPrimary} mt-4`}>
                  + New Lead
                </button>
              )}
            </div>
          ) : view === "board" ? (
            <div className="p-3">
              <LeadBoard leads={pageItems} onLeadClick={setSelectedLeadId} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-240 text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                      <th className="px-4 py-3">Lead</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Next follow-up</th>
                      <th className="px-4 py-3">Added</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pageItems.map((lead) => (
                      <tr
                        key={lead._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-950/30"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedLeadId(lead._id)}
                            className="text-left"
                          >
                            <p className="font-semibold text-slate-900 hover:text-cyan-600 dark:text-white dark:hover:text-cyan-400">
                              {lead.name}
                            </p>
                            <p className="text-xs text-slate-500">{lead.company || "—"}</p>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700 dark:text-slate-200">{lead.phone || "—"}</p>
                          <p className="truncate text-xs text-slate-400">{lead.email || ""}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{lead.source || "—"}</td>
                        <td className="px-4 py-3 font-medium text-emerald-600">
                          {(lead.expectedValue || 0) > 0 ? `₹${Number(lead.expectedValue).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className="max-w-36 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-950"
                            value={lead.status || "New"}
                            disabled={savingStatusId === lead._id}
                            onChange={(e) => quickStatusChange(lead._id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {LEAD_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {lead.nextFollowUpDate
                            ? format(new Date(lead.nextFollowUpDate), "dd MMM yyyy")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {lead.createdAt ? format(new Date(lead.createdAt), "dd MMM yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLeadId(lead._id)}
                            className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="text-xs text-slate-500">
                    Page {currentPage} of {totalPages} · {filtered.length} leads
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={`${btnSecondary} disabled:opacity-40`}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={`${btnSecondary} disabled:opacity-40`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <LeadDetailPanel
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onUpdate={loadLeads}
      />

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Create New Lead</h2>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
                  <input required className={formInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone *</label>
                  <input required className={formInput} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input type="email" className={formInput} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                  <input className={formInput} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Source</label>
                  <select className={formSelect} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Expected Value</label>
                  <input type="number" className={formInput} value={form.expectedValue} onChange={(e) => setForm({ ...form, expectedValue: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Assign To</label>
                  <select className={formSelect} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                    <option value="">Unassigned (or Self)</option>
                    {employees.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                  <textarea className={formTextarea} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setShowNewModal(false)} className={btnSecondary}>Cancel</button>
                <button type="submit" className={btnPrimary}>Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { IClient, ClientStatus } from "@/types/client";
import { ClientFormModal } from "./ClientFormModal";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { btnPrimary, btnSecondary, formInput, formSelect } from "@/components/ui/FormUi";
import { invalidateCachedUrl } from "@/lib/clientDataCache";

type CustomerRow = {
  _id: string;
  name: string;
  mobileNumber: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  status: ClientStatus;
  companyName?: string;
  customerNotes?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt?: string;
};

type Stats = { total: number; live: number; inProgress: number; pending: number };

const STATUS_CLASS: Record<ClientStatus, string> = {
  "Completed (Live)": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Work in Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Expired / Not Working": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function ClientManagementClient() {
  const [items, setItems] = useState<CustomerRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, live: 0, inProgress: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All");
  const [staffOptions, setStaffOptions] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [viewClient, setViewClient] = useState<CustomerRow | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search: debouncedSearch,
      });
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (staffFilter === "unassigned") params.set("staffId", "unassigned");
      else if (staffFilter !== "All") params.set("staffId", staffFilter);

      const res = await fetch(`/api/clients?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load customers");

      setItems(data.items || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      if (data.stats) setStats(data.stats);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, statusFilter, staffFilter]);

  useEffect(() => {
    fetch("/api/employees?lite=1&limit=200")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.items || []) as { _id: string; employeeName: string }[];
        setStaffOptions(list.map((e) => ({ id: e._id, name: e.employeeName })));
      })
      .catch(() => setStaffOptions([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, staffFilter]);

  useEffect(() => {
    load({ silent: items.length > 0 });
  }, [page, debouncedSearch, statusFilter, staffFilter, load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this customer record?")) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Customer deleted");
      invalidateCachedUrl("/api/clients");
      load({ silent: true });
      if (viewClient?._id === id) setViewClient(null);
    } catch {
      toast.error("Delete failed");
    }
  };

  const openEdit = async (row: CustomerRow) => {
    try {
      const res = await fetch(`/api/clients/${row._id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingClient(data as IClient);
      setIsModalOpen(true);
    } catch {
      toast.error("Could not load customer");
    }
  };

  const handleSaved = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    invalidateCachedUrl("/api/clients");
    load({ silent: true });
  };

  if (loading && items.length === 0) {
    return <TableSkeleton columns={5} rows={6} />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Live" value={stats.live} tone="green" />
        <StatCard label="In Progress" value={stats.inProgress} tone="blue" />
        <StatCard label="Pending" value={stats.pending} tone="amber" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <input
            className={`${formInput} sm:max-w-xs`}
            placeholder="Search name, mobile, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className={`${formSelect} sm:max-w-[200px]`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All status</option>
            <option value="Pending">Pending</option>
            <option value="Work in Progress">In Progress</option>
            <option value="Completed (Live)">Live</option>
            <option value="Expired / Not Working">Expired</option>
          </select>
          <select className={`${formSelect} sm:max-w-[220px]`} value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
            <option value="All">All staff</option>
            <option value="unassigned">Not Assigned</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}&apos;s customers
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => load({ silent: true })} className={btnSecondary} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingClient(null);
              setIsModalOpen(true);
            }}
            className={`${btnPrimary} gap-2`}
          >
            <Plus className="size-4" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/50">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Assigned Staff</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No customer records found.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                      {row.companyName ? (
                        <p className="text-xs text-slate-500">{row.companyName}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.mobileNumber}</p>
                      {row.email ? <p className="text-xs text-slate-500">{row.email}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <AssignedStaffBadge name={row.assignedStaffName} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn title="View" onClick={() => setViewClient(row)}>
                          <Eye className="size-4" />
                        </IconBtn>
                        <IconBtn title="Edit" onClick={() => openEdit(row)}>
                          <Pencil className="size-4" />
                        </IconBtn>
                        <IconBtn title="Delete" onClick={() => handleDelete(row._id)} danger>
                          <Trash2 className="size-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
            <span className="text-slate-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
            </span>
            <div className="flex gap-2">
              <button type="button" className={btnSecondary} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button
                type="button"
                className={btnSecondary}
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={editingClient}
        onSaved={handleSaved}
      />

      {viewClient ? (
        <CustomerViewModal client={viewClient} onClose={() => setViewClient(null)} onEdit={() => openEdit(viewClient)} />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "green" | "blue" | "amber";
}) {
  const toneClass = {
    slate: "border-slate-200 dark:border-slate-800",
    green: "border-emerald-200 dark:border-emerald-900/40",
    blue: "border-blue-200 dark:border-blue-900/40",
    amber: "border-amber-200 dark:border-amber-900/40",
  }[tone];

  return (
    <div className={`rounded-xl border bg-white p-4 dark:bg-slate-900 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function AssignedStaffBadge({ name }: { name?: string }) {
  if (!name) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-400 dark:border-slate-600">
        Not Assigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200">
      <UserRound className="size-3.5 shrink-0" />
      <span>Under {name}</span>
    </span>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg border p-2 transition ${
        danger
          ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
          : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function CustomerViewModal({
  client,
  onClose,
  onEdit,
}: {
  client: CustomerRow;
  onClose: () => void;
  onEdit: () => void;
}) {
  const rows: [string, string][] = [
    ["Customer Name", client.name],
    ["Company", client.companyName || "—"],
    ["Mobile", client.mobileNumber],
    ["Email", client.email || "—"],
    ["City", client.city || "—"],
    ["State", client.state || "—"],
    ["Address", client.address || "—"],
    ["Status", client.status],
    ["Notes", client.customerNotes || "—"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{client.name}</h3>
        <p className="text-sm text-slate-500">Customer record details</p>

        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            Assigned Staff
          </p>
          {client.assignedStaffName ? (
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              This customer is assigned under{" "}
              <span className="text-indigo-700 dark:text-indigo-300">{client.assignedStaffName}</span>.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Not Assigned</p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800">
              <span className="text-slate-500">{label}</span>
              <span className="max-w-[60%] text-right font-medium text-slate-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onEdit} className={`${btnPrimary} flex-1`}>
            Edit
          </button>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

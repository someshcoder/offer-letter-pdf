"use client";

import { TableSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  rowKey: (row: T) => string;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  actions?: (row: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DataTable<T>({
  columns,
  data,
  loading,
  rowKey,
  pagination,
  actions,
  emptyTitle = "No records found",
  emptyDescription,
}: Props<T>) {
  if (loading) return <TableSkeleton columns={columns.length + (actions ? 1 : 0)} />;

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 ${col.className || ""}`}>
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={rowKey(row)} className="border-b border-slate-100 last:border-0 dark:border-slate-800/80">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-slate-700 dark:text-slate-200 ${col.className || ""}`}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </td>
                ))}
                {actions && <td className="px-4 py-3">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold disabled:opacity-40 dark:border-slate-600"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold disabled:opacity-40 dark:border-slate-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SearchFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions,
  onRefresh,
  refreshing,
  action,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  status?: string;
  onStatusChange?: (v: string) => void;
  statusOptions?: { value: string; label: string }[];
  onRefresh?: () => void;
  refreshing?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 sm:max-w-xs"
        />
        {statusOptions && onStatusChange && (
          <select
            value={status || "All"}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
        {onRefresh && (
          <button type="button" onClick={onRefresh} disabled={refreshing} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-60 dark:border-slate-600">
            {refreshing ? "Updating..." : "Refresh"}
          </button>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status, colorMap }: { status: string; colorMap?: Record<string, string> }) {
  const defaultColors: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    Active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Converted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    New: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    Approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    Rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    Overdue: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    Expired: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Closed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    Archived: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "On Hold": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    Allocated: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    "In Review": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  };
  const colors = colorMap || defaultColors;
  const cls = colors[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

export function PageShell({
  title,
  subtitle,
  breadcrumbs,
  action,
  headerExtra,
  children,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: React.ReactNode;
  action?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {breadcrumbs}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {headerExtra}
      {children}
    </div>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
export {
  formInput as inputClass,
  formInput,
  formSelect,
  formTextarea,
} from "@/components/ui/FormUi";

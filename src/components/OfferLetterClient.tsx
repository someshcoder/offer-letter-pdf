"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PdfEditorShell } from "@/components/PdfEditorShell";
import { TableSkeleton } from "@/components/SkeletonLoader";
import type { AccessRole } from "@/types/employee";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { documentBreadcrumbs } from "@/lib/navigation";
import {
  FileText,
  Eye,
  Pencil,
  Plus,
  ChevronLeft,
  Calendar,
  Hash,
  User,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";

type SavedItem = {
  id: string;
  title: string;
  documentKind: string;
  refNo?: string;
  name?: string;
  email?: string;
  createdAt: string;
  mailSentAt?: string;
  mailError?: string;
  lastMailTo?: string;
};

type Props = {
  userRole?: AccessRole | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(dateStr: string) {
  try {
    return dateFormatter.format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function OfferLetterClient({ userRole }: Props) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pdfs", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load offer letters");
      const data = (await res.json()) as { items?: SavedItem[] };
      // Only show offer-type documents
      const offerItems = (data.items || []).filter(
        (item) => item.documentKind === "offer"
      );
      setItems(offerItems);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleEdit = useCallback((id: string) => {
    setEditId(id);
    setView("edit");
  }, []);

  const handleViewPdf = useCallback((id: string) => {
    window.open(`/api/pdfs/${id}/file`, "_blank");
  }, []);

  const handleBackToList = useCallback(() => {
    setView("list");
    setEditId(null);
    fetchItems(); // Refresh list
  }, [fetchItems]);

  const handleCreate = useCallback(() => {
    setView("create");
  }, []);

  const formattedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        createdAtLabel: formatDate(item.createdAt),
      })),
    [items],
  );

  // Show editor
  if (view === "create" || view === "edit") {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Back button bar */}
        <div className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ChevronLeft className="size-4" />
            Back to Offer Letters
          </button>
        </div>
        <PdfEditorShell userRole={userRole} editId={editId} />
      </div>
    );
  }

  // Show list view
  return (
    <div className="min-h-screen flex-1 px-3 py-4 sm:px-5 sm:py-6 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
        <Breadcrumb items={documentBreadcrumbs("offerLetter")} />
        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70 sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_10%,rgba(45,212,191,0.16),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_38%)]"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
                Documents
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Offer Letter
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Manage and create offer letters for employees.
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md active:scale-[0.97]"
            >
              <Plus className="size-4" />
              Create Offer Letter
            </button>
          </div>
        </header>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <AlertCircle className="size-6" />
              </div>
              <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
              <button
                onClick={fetchItems}
                className="mt-3 text-sm text-teal-600 underline hover:text-teal-700 dark:text-teal-400"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                <FileText className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                No offer letters yet
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Get started by creating your first offer letter. It will appear
                here once saved.
              </p>
              <button
                onClick={handleCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700"
              >
                <Plus className="size-4" />
                Create Offer Letter
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/50">
                      <th className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Hash className="size-3.5" />
                          Ref No.
                        </span>
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          Issue Date
                        </span>
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="size-3.5" />
                          Issued To
                        </span>
                      </th>
                      <th className="px-5 py-3.5 text-right font-semibold text-slate-500 dark:text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formattedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20">
                            {item.refNo || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                          {item.createdAtLabel}
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {item.name || "—"}
                            </p>
                            {item.email && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <Mail className="size-3" />
                                {item.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:bg-teal-950/30 dark:hover:text-teal-300"
                              title="Edit"
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleViewPdf(item.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md"
                              title="View PDF"
                            >
                              <Eye className="size-3.5" />
                              View PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 p-4 md:hidden">
                {formattedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20">
                          {item.refNo || "—"}
                        </span>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.name || "—"}
                        </p>
                        {item.email && (
                          <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Mail className="size-3" />
                            {item.email}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {item.createdAtLabel}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleViewPdf(item.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-teal-700"
                      >
                        <Eye className="size-3.5" />
                        View PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {items.length} offer letter{items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

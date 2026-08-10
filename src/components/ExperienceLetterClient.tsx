"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ExperienceForm } from "@/components/ExperienceForm";
import { ExperiencePreview } from "@/components/ExperiencePreview";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { documentBreadcrumbs } from "@/lib/navigation";
import { ExperienceLetterData } from "@/utils/experienceLetterGenerator";
import {
  FileBadge,
  Sparkles,
  Plus,
  Eye,
  Pencil,
  ChevronLeft,
  Calendar,
  Hash,
  User,
  Mail,
  Loader2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { motion } from "framer-motion";

type SavedItem = {
  id: string;
  refNo: string;
  employeeName: string;
  companyName: string;
  role: string;
  joiningDate: string;
  endingDate: string;
  performance: string;
  remarks: string;
  template: "simple" | "professional";
  logo?: string;
  signature?: string;
  email?: string;
  showCompanyName?: boolean;
  showCompanyAddress?: boolean;
  showCompanyMobile?: boolean;
  showCompanyEmail?: boolean;
  showCompanyWebsite?: boolean;
  showCompanyLogo?: boolean;
  authorizedSignatory?: "Director" | "HR" | "None";
  companyAddress?: string;
  companyMobile?: string;
  companyEmail?: string;
  companyWebsite?: string;
  createdAt: string;
};

export default function ExperienceLetterClient() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editItem, setEditItem] = useState<SavedItem | null>(null);

  const [formData, setFormData] = useState<ExperienceLetterData>({
    employeeName: "",
    companyName: "Somesh Coder Ltd",
    role: "",
    joiningDate: "",
    endingDate: new Date().toISOString().split("T")[0],
    performance: "Excellent",
    remarks: "",
    template: "professional",
    showCompanyName: true,
    showCompanyAddress: true,
    showCompanyMobile: true,
    showCompanyEmail: true,
    showCompanyWebsite: true,
    showCompanyLogo: true,
    authorizedSignatory: "HR",
    companyAddress: "",
    companyMobile: "",
    companyEmail: "",
    companyWebsite: "",
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/experience-letters", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load experience letters");
      const data = (await res.json()) as { items?: SavedItem[] };
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreate = () => {
    setFormData({
      employeeName: "",
      companyName: "Somesh Coder Ltd",
      role: "",
      joiningDate: "",
      endingDate: new Date().toISOString().split("T")[0],
      performance: "Excellent",
      remarks: "",
      template: "professional",
      showCompanyName: true,
      showCompanyAddress: true,
      showCompanyMobile: true,
      showCompanyEmail: true,
      showCompanyWebsite: true,
      showCompanyLogo: true,
      authorizedSignatory: "HR",
      companyAddress: "",
      companyMobile: "",
      companyEmail: "",
      companyWebsite: "",
    });
    setEditItem(null);
    setView("create");
  };

  const handleEdit = (item: SavedItem) => {
    setFormData({
      employeeName: item.employeeName,
      companyName: item.companyName,
      role: item.role,
      joiningDate: item.joiningDate,
      endingDate: item.endingDate,
      performance: item.performance,
      remarks: item.remarks || "",
      template: item.template || "professional",
      logo: item.logo,
      signature: item.signature,
      companyAddress: item.companyAddress,
      companyMobile: item.companyMobile,
      companyEmail: item.companyEmail,
      companyWebsite: item.companyWebsite,
      authorizedSignatory: item.authorizedSignatory || "HR",
    });
    setEditItem(item);
    setView("edit");
  };

  const handleViewPdf = (id: string) => {
    window.open(`/api/experience-letters/${id}/file`, "_blank");
  };

  const handleBackToList = () => {
    setView("list");
    setEditItem(null);
    fetchItems();
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Show editor (create or edit)
  if (view === "create" || view === "edit") {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Back button */}
          <button
            onClick={handleBackToList}
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ChevronLeft className="size-4" />
            Back to Experience Letters
          </button>

          <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400">
                  <Sparkles className="size-3" />{" "}
                  {view === "edit" ? "Editing" : "New"}
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Documents Suite
                </p>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Experience Letter{" "}
                <span className="text-cyan-600 dark:text-cyan-400">
                  Generator
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Generate professional experience certificates in seconds.
                Auto-fill employee data, calculate duration, and export as
                premium PDF.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 shadow-lg shadow-cyan-600/10"
            >
              <FileBadge className="h-7 w-7" />
            </motion.div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1fr_500px] xl:grid-cols-[1fr_600px]">
            <ExperienceForm data={formData} onChange={setFormData} />
            <ExperiencePreview data={formData} onSaved={handleBackToList} />
          </div>
        </div>

        {/* Background Decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-24 size-96 rounded-full bg-cyan-500/5 blur-3xl"></div>
          <div className="absolute bottom-1/4 -left-24 size-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen flex-1 px-3 py-4 sm:px-5 sm:py-6 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
        <Breadcrumb items={documentBreadcrumbs("experienceLetter")} />
        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70 sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_10%,rgba(6,182,212,0.16),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_38%)]"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                Documents
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Experience Letter
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Manage and create experience letters for employees.
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-cyan-700 hover:shadow-md active:scale-[0.97]"
            >
              <Plus className="size-4" />
              Create Experience Letter
            </button>
          </div>
        </header>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {loading ? (
            <TableSkeleton columns={5} rows={5} />
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
                className="mt-3 text-sm text-cyan-600 underline hover:text-cyan-700 dark:text-cyan-400"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
                <FileBadge className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                No experience letters yet
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Get started by creating your first experience letter. It will
                appear here once saved.
              </p>
              <button
                onClick={handleCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-cyan-700"
              >
                <Plus className="size-4" />
                Create Experience Letter
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
                      <th className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase className="size-3.5" />
                          Role
                        </span>
                      </th>
                      <th className="px-5 py-3.5 text-right font-semibold text-slate-500 dark:text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-600/10 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-400/20">
                            {item.refNo || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {item.employeeName || "—"}
                            </p>
                            {item.email && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <Mail className="size-3" />
                                {item.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                          {item.role || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300"
                              title="Edit"
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleViewPdf(item.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-cyan-700 hover:shadow-md"
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
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-700 ring-1 ring-cyan-600/10 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-400/20">
                          {item.refNo || "—"}
                        </span>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.employeeName || "—"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.role || "—"}
                        </p>
                        {item.email && (
                          <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Mail className="size-3" />
                            {item.email}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleViewPdf(item.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-cyan-700"
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
                  Showing {items.length} experience letter
                  {items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

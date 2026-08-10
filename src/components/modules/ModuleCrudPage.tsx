"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import {
  DataTable,
  PageShell,
  SearchFilterBar,
  StatusBadge,
  btnPrimary,
  btnSecondary,
  formInput,
  formSelect,
  formTextarea,
  type Column,
} from "@/components/modules/DataTable";
import {
  FormActions,
  FormField,
  FormModal,
} from "@/components/ui/FormUi";
import { ConfirmDialog } from "@/components/modules/ConfirmDialog";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { fetchJsonCached, getCachedJson, invalidateCachedUrl } from "@/lib/clientDataCache";

const MODULE_CACHE_TTL_MS = 60_000;

export type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  options?: { value: string; label: string }[];
  required?: boolean;
  readOnly?: boolean;
};

type Props<T extends Record<string, unknown>> = {
  title: string;
  subtitle?: string;
  apiPath: string;
  breadcrumbs: { label: string; href?: string }[];
  columns: Column<T>[];
  fields: FieldConfig[];
  statusOptions?: { value: string; label: string }[];
  getRowId: (row: T) => string;
  defaultForm?: Record<string, string>;
  canCreate?: boolean;
  extraActions?: (row: T, reload: () => void) => React.ReactNode;
  hiddenFieldKeys?: string[];
  onFieldChange?: (
    key: string,
    value: string,
    setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  ) => void;
  transformPayload?: (
    payload: Record<string, unknown>,
    form: Record<string, string>,
  ) => Record<string, unknown>;
  mapRowToForm?: (row: T) => Record<string, string>;
  fetchEditForm?: (row: T) => Promise<Record<string, string>>;
  renderFormExtra?: (form: Record<string, string>) => React.ReactNode;
  headerExtra?: React.ReactNode;
};

function formatDateFieldValue(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? "" : val.toISOString().slice(0, 10);
  }
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function ModuleCrudPage<T extends Record<string, unknown>>({
  title,
  subtitle,
  apiPath,
  breadcrumbs,
  columns,
  fields,
  statusOptions,
  getRowId,
  defaultForm = {},
  canCreate = true,
  extraActions,
  hiddenFieldKeys = [],
  onFieldChange,
  transformPayload,
  mapRowToForm,
  fetchEditForm,
  renderFormExtra,
  headerExtra,
}: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string>>(defaultForm);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isFirstLoadRef = useRef(true);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search: debouncedSearch,
      });
      if (status !== "All") params.set("status", status);
      const requestUrl = `${apiPath}?${params}`;
      type ListPayload = {
        items: T[];
        pagination: { page: number; totalPages: number; total: number };
      };

      const cached = getCachedJson<ListPayload>(requestUrl, MODULE_CACHE_TTL_MS);
      if (cached) {
        setItems(cached.items || []);
        setPagination(cached.pagination || { page: 1, totalPages: 1, total: 0 });
        setInitialLoad(false);
        isFirstLoadRef.current = false;
      }

      const silent = opts?.silent ?? (Boolean(cached) || !isFirstLoadRef.current);
      if (!silent) {
        setInitialLoad(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await fetchJsonCached<ListPayload>(requestUrl, {
          ttlMs: MODULE_CACHE_TTL_MS,
          init: { signal: controller.signal },
        });
        if (controller.signal.aborted) return;
        setItems(data.items || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        if (controller.signal.aborted) return;
        if (!cached) toast.error(err instanceof Error ? err.message : "Load failed");
      } finally {
        if (!controller.signal.aborted) {
          isFirstLoadRef.current = false;
          setInitialLoad(false);
          setRefreshing(false);
        }
      }
    },
    [apiPath, page, debouncedSearch, status],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    load({ silent: !isFirstLoadRef.current });
    return () => abortRef.current?.abort();
  }, [load]);

  const reload = useCallback(() => {
    load({ silent: true });
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = async (row: T) => {
    setEditing(row);
    setModalOpen(true);
    if (fetchEditForm) {
      setFormLoading(true);
      try {
        setForm(await fetchEditForm(row));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load record");
        setModalOpen(false);
      } finally {
        setFormLoading(false);
      }
      return;
    }
    if (mapRowToForm) {
      setForm(mapRowToForm(row));
    } else {
      const next: Record<string, string> = {};
      fields.forEach((f) => {
        const val = row[f.key];
        if (val == null) {
          next[f.key] = "";
        } else if (f.type === "date") {
          next[f.key] = formatDateFieldValue(val);
        } else {
          next[f.key] = String(val);
        }
      });
      hiddenFieldKeys.forEach((key) => {
        const val = row[key];
        if (val != null) next[key] = String(val);
      });
      setForm(next);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    onFieldChange?.(key, value, setForm);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      fields.forEach((f) => {
        if (f.type === "date") {
          payload[f.key] = form[f.key] || null;
          return;
        }
        if (form[f.key] !== undefined && form[f.key] !== "") {
          payload[f.key] = f.type === "number" ? Number(form[f.key]) : form[f.key];
        }
      });
      hiddenFieldKeys.forEach((key) => {
        if (form[key] !== undefined && form[key] !== "") {
          payload[key] = form[key];
        }
      });
      const body = transformPayload ? transformPayload(payload, form) : payload;
      const url = editing ? `${apiPath}/${getRowId(editing)}` : apiPath;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(editing ? "Updated" : "Created");
      setModalOpen(false);
      invalidateCachedUrl(apiPath);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${apiPath}/${getRowId(deleteTarget)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted");
      setDeleteTarget(null);
      invalidateCachedUrl(apiPath);
      reload();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      breadcrumbs={<Breadcrumb items={breadcrumbs} />}
      action={
        canCreate ? (
          <button type="button" onClick={openCreate} className={btnPrimary}>
            + Add New
          </button>
        ) : undefined
      }
    >
      {headerExtra}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        statusOptions={statusOptions}
        onRefresh={reload}
        refreshing={refreshing}
      />
      <DataTable
        columns={columns}
        data={items}
        loading={initialLoad}
        rowKey={getRowId}
        pagination={{
          page: pagination.page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          onPageChange: setPage,
        }}
        actions={(row) => (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openEdit(row)} className={btnSecondary}>
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="rounded-xl border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600"
            >
              Delete
            </button>
            {extraActions?.(row, reload)}
          </div>
        )}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editing ? "Edit" : "Create"} ${title}`}
        subtitle={subtitle}
        size="lg"
        footer={
          <FormActions
            onCancel={() => setModalOpen(false)}
            onSubmit={save}
            loading={saving || formLoading}
            submitLabel={editing ? "Update" : "Create"}
          />
        }
      >
        {formLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading details…</p>
        ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const fullWidth = field.type === "textarea";
            return (
              <FormField
                key={field.key}
                label={field.label}
                required={field.required}
                className={fullWidth ? "sm:col-span-2" : ""}
              >
                {field.type === "select" ? (
                  <select
                    className={formSelect}
                    value={form[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    className={formTextarea}
                    rows={3}
                    value={form[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  />
                ) : (
                  <input
                    type={field.type || "text"}
                    className={`${formInput}${field.readOnly ? " cursor-not-allowed bg-slate-50 dark:bg-slate-900/50" : ""}`}
                    value={form[field.key] || ""}
                    readOnly={field.readOnly}
                    onChange={
                      field.readOnly
                        ? undefined
                        : (e) => handleFieldChange(field.key, e.target.value)
                    }
                  />
                )}
              </FormField>
            );
          })}
        </div>
        )}
        {!formLoading && renderFormExtra?.(form)}
      </FormModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete record?"
        message="This will soft-delete the record."
        danger
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}

export { StatusBadge };

"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/* ── Design tokens ───────────────────────────────────────────── */

export const formLabel =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export const formHint = "mt-1 text-[11px] text-slate-500 dark:text-slate-400";

export const formError = "mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400";

export const formInput =
  "box-border w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:bg-slate-950 dark:focus:ring-cyan-400/15";

export const formSelect = `${formInput} form-select pr-10`;

export const formTextarea = `${formInput} min-h-[96px] resize-y leading-relaxed`;

export const formFile =
  "mt-1 w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-500 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-cyan-700 hover:border-cyan-400 hover:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-cyan-300";

export const formSection =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-6";

export const formSectionHeader =
  "mb-5 flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-slate-800";

export const formSectionIcon =
  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400";

export const formSectionTitle = "text-base font-bold text-slate-900 dark:text-white";

export const formSectionDesc = "mt-0.5 text-xs text-slate-500 dark:text-slate-400";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-cyan-600/20 transition hover:bg-cyan-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";

/** @deprecated use formInput */
export const inputClass = formInput;

/* ── Primitives ──────────────────────────────────────────────── */

export function FormField({
  label,
  required,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block">
        <span className={formLabel}>
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </span>
        {children}
        {hint && !error ? <p className={formHint}>{hint}</p> : null}
        {error ? <p className={formError}>{error}</p> : null}
      </label>
    </div>
  );
}

export function FormSection({
  title,
  description,
  icon,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${formSection} ${className}`}>
      <div className={formSectionHeader}>
        {icon ? <div className={formSectionIcon}>{icon}</div> : null}
        <div>
          <h2 className={formSectionTitle}>{title}</h2>
          {description ? <p className={formSectionDesc}>{description}</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function FormGrid({
  children,
  cols = 2,
  className = "",
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}) {
  const colClass =
    cols === 1 ? "grid-cols-1" : cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return <div className={`grid grid-cols-1 gap-4 ${colClass} ${className}`}>{children}</div>;
}

export function FormInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${formInput} ${props.className || ""}`} />;
}

export function FormSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${formSelect} ${props.className || ""}`} />;
}

export function FormTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${formTextarea} ${props.className || ""}`} />;
}

export function FormAlert({
  type = "error",
  children,
}: {
  type?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300",
    info: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-300",
  }[type];

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}>{children}</div>
  );
}

export function FormActions({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading,
  formId,
}: {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  formId?: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
      {onCancel ? (
        <button type="button" onClick={onCancel} className={btnSecondary}>
          {cancelLabel}
        </button>
      ) : null}
      <button
        type={formId ? "submit" : "button"}
        form={formId}
        onClick={onSubmit}
        disabled={loading}
        className={btnPrimary}
      >
        {loading ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}

export function FormModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  if (!open) return null;

  const maxW =
    size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[92vh] w-full ${maxW} flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:rounded-3xl`}
      >
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-cyan-500/5 via-white to-indigo-500/5 px-5 py-5 dark:border-slate-800 dark:from-cyan-500/10 dark:via-slate-950 dark:to-indigo-500/10 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{title}</h2>
                {subtitle ? (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FormCheckbox({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-cyan-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-600"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

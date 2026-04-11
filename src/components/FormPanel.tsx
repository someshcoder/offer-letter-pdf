import {
  DOCUMENT_KIND_LABELS,
  type DocumentKind,
  type FormFields,
} from "@/lib/formTypes";

type FormPanelProps = {
  documentKind: DocumentKind;
  onDocumentKindChange: (kind: DocumentKind) => void;
  form: FormFields;
  onChange: (field: keyof FormFields, value: string) => void;
  livePreview: boolean;
  onLivePreviewChange: (value: boolean) => void;
  onGenerate: () => void;
  onClear: () => void;
  loading: boolean;
  onSaveToDatabase: () => void;
  serverBusy: boolean;
  serverMessage: string | null;
};

const FIELD_CONFIG: { key: keyof FormFields; label: string; placeholder: string }[] = [
  { key: "refNo", label: "Ref No", placeholder: "e.g. REF-2026-001" },
  { key: "offerAsOn", label: "Offer As On", placeholder: "e.g. 08 Apr 2026" },
  { key: "month", label: "Month", placeholder: "e.g. 3 months" },
  { key: "name", label: "Name", placeholder: "Full name" },
  { key: "address", label: "Address", placeholder: "Street, city" },
  { key: "subject", label: "Subject", placeholder: "Letter subject" },
  { key: "salary", label: "Salary", placeholder: "e.g. 10,000" },
  { key: "email", label: "Email", placeholder: "you@company.com" },
  { key: "mobile", label: "Mobile", placeholder: "+91 …" },
];

const fieldClass =
  "box-border w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-normal text-slate-950 caret-indigo-600 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20";

const KIND_OPTIONS = Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[];

export function FormPanel({
  documentKind,
  onDocumentKindChange,
  form,
  onChange,
  livePreview,
  onLivePreviewChange,
  onGenerate,
  onClear,
  loading,
  onSaveToDatabase,
  serverBusy,
  serverMessage,
}: FormPanelProps) {
  const busy = loading || serverBusy;

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/70 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-black/40 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
          Offer Letter Editor
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Fill candidate details
        </h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          These values are drawn onto <strong className="font-semibold">sample.pdf</strong>.
        </p>
      </div>

      <div className="flex max-h-[72vh] flex-col gap-4 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable] lg:max-h-none lg:overflow-visible">
        <label className="block shrink-0 text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Document type
          </span>
          <select
            value={documentKind}
            onChange={(e) => onDocumentKindChange(e.target.value as DocumentKind)}
            className={fieldClass}
          >
            {KIND_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {DOCUMENT_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Labels each saved PDF on the hub.
          </p>
        </label>

        {FIELD_CONFIG.map(({ key, label, placeholder }) => {
          const multiline = key === "address";
          return (
            <label key={key} className="block shrink-0 text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                {label}
              </span>
              {multiline ? (
                <div className="space-y-1">
                  <textarea
                    value={form[key]}
                    onChange={(e) => onChange(key, e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className={`${fieldClass} resize-y`}
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Long addresses wrap (max 2 lines) so &quot;Congratulations!&quot; stays visible.
                  </p>
                </div>
              ) : (
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  autoComplete="off"
                  className={fieldClass}
                />
              )}
            </label>
          );
        })}
      </div>

      <label className="flex shrink-0 cursor-pointer items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
        <input
          type="checkbox"
          checked={livePreview}
          onChange={(e) => onLivePreviewChange(e.target.checked)}
          className="size-5 shrink-0 rounded border-2 border-slate-400 text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:border-slate-500"
        />
        Live preview
      </label>

      {serverMessage && (
        <p className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {serverMessage}
        </p>
      )}

      <div className="mt-auto flex shrink-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onGenerate}
            disabled={busy}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner light />
                Generating…
              </>
            ) : (
              "Download PDF"
            )}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            Clear
          </button>
        </div>
        <button
          type="button"
          onClick={onSaveToDatabase}
          disabled={busy}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-950/70"
        >
          {serverBusy ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  );
}

function Spinner({ light }: { light?: boolean }) {
  return (
    <span
      className={`inline-block size-4 animate-spin rounded-full border-2 border-t-transparent ${light ? "border-white" : "border-indigo-600 dark:border-indigo-300"}`}
      aria-hidden
    />
  );
}

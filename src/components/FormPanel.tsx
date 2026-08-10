import {

  DOCUMENT_KIND_LABELS,

  type DocumentKind,

  type FormFields,

} from "@/lib/formTypes";

import type { Employee } from "@/types/employee";

import {
  btnPrimary,
  btnSecondary,
  FormCheckbox,
  formHint,
  formInput,
  formLabel,
  formSection,
  formSectionDesc,
  formSectionTitle,
  formSelect,
  formTextarea,
} from "@/components/ui/FormUi";



type FormPanelProps = {

  documentKind: DocumentKind;

  onDocumentKindChange: (kind: DocumentKind) => void;

  employees: Employee[];

  selectedEmployeeId: string;

  onSelectEmployee: (id: string) => void;

  form: FormFields;

  onChange: (field: keyof FormFields, value: string) => void;

  livePreview: boolean;

  onLivePreviewChange: (value: boolean) => void;

  onGenerate: () => void;

  onReset: () => void;

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



const KIND_OPTIONS = Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[];



export function FormPanel({

  documentKind,

  onDocumentKindChange,

  employees,

  selectedEmployeeId,

  onSelectEmployee,

  form,

  onChange,

  livePreview,

  onLivePreviewChange,

  onGenerate,

  onReset,

  loading,

  onSaveToDatabase,

  serverBusy,

  serverMessage,

}: FormPanelProps) {

  const busy = loading || serverBusy;



  return (

    <div className={`${formSection} flex flex-col gap-6 shadow-lg shadow-slate-200/50 dark:shadow-black/20`}>

      <div>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">

          Documents

        </p>

        <h2 className={`mt-1 ${formSectionTitle}`}>Offer letter details</h2>

        <p className={formSectionDesc}>

          Values are drawn onto the PDF template when you download or save.

        </p>

      </div>



      <div className="flex max-h-[72vh] flex-col gap-4 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable] lg:max-h-none lg:overflow-visible">

        <label className="block shrink-0">

          <span className={formLabel}>Autofill from employee</span>

          <select

            value={selectedEmployeeId}

            onChange={(e) => onSelectEmployee(e.target.value)}

            className={formSelect}

          >

            <option value="">Manual entry</option>

            {employees.map((emp) => (

              <option key={emp._id} value={emp._id}>

                {emp.employeeName} · {emp.designation}

              </option>

            ))}

          </select>

        </label>



        <label className="block shrink-0">

          <span className={formLabel}>Document type</span>

          <select

            value={documentKind}

            onChange={(e) => onDocumentKindChange(e.target.value as DocumentKind)}

            className={formSelect}

          >

            {KIND_OPTIONS.map((k) => (

              <option key={k} value={k}>

                {DOCUMENT_KIND_LABELS[k]}

              </option>

            ))}

          </select>

          <p className={formHint}>Labels each saved PDF on the hub.</p>

        </label>



        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {FIELD_CONFIG.map(({ key, label, placeholder }) => {

            if (key === "month" && documentKind === "offer") return null;

            const multiline = key === "address";

            return (

              <label

                key={key}

                className={`block shrink-0 ${multiline ? "md:col-span-2" : ""}`}

              >

                <span className={formLabel}>{label}</span>

                {multiline ? (

                  <div className="space-y-1">

                    <textarea

                      value={form[key]}

                      onChange={(e) => onChange(key, e.target.value)}

                      placeholder={placeholder}

                      rows={4}

                      className={formTextarea}

                    />

                    <p className={formHint}>

                      Long addresses wrap so the letter layout stays clean.

                    </p>

                  </div>

                ) : (

                  <input

                    type="text"

                    value={form[key]}

                    onChange={(e) => onChange(key, e.target.value)}

                    placeholder={placeholder}

                    autoComplete="off"

                    maxLength={key === "mobile" ? 10 : undefined}

                    onInput={

                      key === "mobile"

                        ? (e) => {

                            const target = e.target as HTMLInputElement;

                            target.value = target.value.replace(/[^0-9]/g, "");

                          }

                        : undefined

                    }

                    className={formInput}

                  />

                )}

              </label>

            );

          })}

        </div>

      </div>



      <FormCheckbox

        label="Live preview"

        description="Update the PDF preview as you type"

        checked={livePreview}

        onChange={onLivePreviewChange}

      />



      {serverMessage && (

        <p className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">

          {serverMessage}

        </p>

      )}



      <div className="mt-auto flex shrink-0 flex-col gap-3">

        <div className="flex flex-col gap-3 sm:flex-row">

          <button

            type="button"

            onClick={onGenerate}

            disabled={busy}

            className={`${btnPrimary} min-h-12 flex-1 py-3`}

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

            onClick={onReset}

            disabled={busy}

            className={`${btnSecondary} min-h-12 py-3`}

          >

            Reset

          </button>

        </div>

        <button

          type="button"

          onClick={onSaveToDatabase}

          disabled={busy}

          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-60 dark:border-cyan-800/50 dark:bg-cyan-950/40 dark:text-cyan-200 dark:hover:bg-cyan-950/70"

        >

          {serverBusy ? (

            <>

              <Spinner />

              Saving…

            </>

          ) : (

            "Save to database"

          )}

        </button>

      </div>

    </div>

  );

}



function Spinner({ light }: { light?: boolean }) {

  return (

    <span

      className={`inline-block size-4 animate-spin rounded-full border-2 border-t-transparent ${light ? "border-white" : "border-cyan-600 dark:border-cyan-300"}`}

      aria-hidden

    />

  );

}



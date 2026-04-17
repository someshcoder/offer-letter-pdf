"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeFormValues } from "@/lib/employeeSchema";
import { ACCESS_ROLES, WORKING_TYPES, type Employee } from "@/types/employee";

type Props = {
  mode: "create" | "edit";
  initial?: Employee;
  loading?: boolean;
  onSubmit: (payload: { values: EmployeeFormValues; files: FormData }) => Promise<void>;
};

const MANAGEMENT_ROLES = [
  "TL",
  "HR",
  "Manager",
  "Assistant Manager",
  "Project Manager",
  "Sales Manager",
  "Operations Manager",
];

const DEVELOPER_ROLES = [
  "MERN Stack Developer",
  "Android Developer",
  "PHP Developer",
  "React Developer",
  "Node.js Developer",
  "Flutter Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "DevOps Engineer",
  "UI/UX Designer",
];

const fieldClass =
  "mt-1 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-800";

const fileInputClass =
  "mt-1 w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-500 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-cyan-700 hover:file:bg-cyan-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:file:bg-slate-700 dark:file:text-cyan-300";

function guessCategory(designation: string): string {
  if (MANAGEMENT_ROLES.includes(designation)) return "Management";
  if (DEVELOPER_ROLES.includes(designation)) return "Development";
  if (designation) return "Other";
  return "";
}

function buildDefaults(initial?: Employee): EmployeeFormValues {
  if (!initial) {
    return {
      employeeName: "",
      mobileNumber: "",
      alternateNumber: "",
      email: "",
      designation: "",
      role: "Employee",
      accessRole: "Employee",
      workingType: "Full Time",
      currentAddress: "",
      permanentAddress: "",
      workingLocation: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      upiId: "",
      upiHolderName: "",
      aadharNumber: "",
      panNumber: "",
    };
  }

  return {
    employeeName: initial.employeeName,
    mobileNumber: initial.mobileNumber,
    alternateNumber: initial.alternateNumber || "",
    email: initial.email,
    designation: initial.designation,
    role: initial.role,
    accessRole: initial.accessRole,
    workingType: initial.workingType,
    currentAddress: initial.address.currentAddress,
    permanentAddress: initial.address.permanentAddress,
    workingLocation: initial.address.workingLocation,
    accountHolderName: initial.accountDetails.accountHolderName || "",
    accountNumber: initial.accountDetails.accountNumber,
    ifscCode: initial.accountDetails.ifscCode,
    bankName: initial.accountDetails.bankName,
    upiId: initial.accountDetails.upiId || "",
    upiHolderName: initial.accountDetails.upiHolderName || "",
    aadharNumber: initial.documents.aadharNumber,
    panNumber: initial.documents.panNumber || "",
    reportingTLId: initial.reportingTL?.id || "",
    reportingTLName: initial.reportingTL?.employeeName || "",
    reportingTLEmail: initial.reportingTL?.email || "",
  };
}

export function EmployeeForm({ mode, initial, loading, onSubmit }: Props) {
  const defaults = useMemo(() => buildDefaults(initial), [initial]);

  const initCategory = guessCategory(initial?.designation || "");
  const initRole =
    initCategory === "Management" || initCategory === "Development"
      ? (initial?.designation ?? "")
      : "";

  const [deptCategory, setDeptCategory] = useState<string>(initCategory);
  const [deptRole, setDeptRole] = useState<string>(initRole);
  const [managers, setManagers] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    fetch("/api/employees/managers")
      .then((res) => res.json())
      .then((data) => {
        // Fetch full email info if needed, or assume data has it
        // For now let's assume /api/employees/managers has name and we need email
        setManagers(data.items || []);
      })
      .catch(console.error);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: defaults,
  });

  const reportingTLId = watch("reportingTLId");

  function handleCategoryChange(cat: string) {
    setDeptCategory(cat);
    setDeptRole("");
    setValue("designation", "", { shouldValidate: false });
  }

  function handleRoleChange(role: string) {
    setDeptRole(role);
    setValue("designation", role, { shouldValidate: true });
  }

  function handleTLChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tlId = e.target.value;
    const tl = managers.find((m) => m.id === tlId);
    if (tl) {
      setValue("reportingTLId", tl.id);
      setValue("reportingTLName", tl.name);
      setValue("reportingTLEmail", (tl as any).email || ""); // Ensure email is in the API
    } else {
      setValue("reportingTLId", "");
      setValue("reportingTLName", "");
      setValue("reportingTLEmail", "");
    }
  }

  const roleOptions =
    deptCategory === "Management"
      ? MANAGEMENT_ROLES
      : deptCategory === "Development"
        ? DEVELOPER_ROLES
        : [];

  async function submit(values: EmployeeFormValues, event?: React.BaseSyntheticEvent) {
    const nativeForm = event?.target as HTMLFormElement | undefined;
    if (!nativeForm) return;

    const fd = new FormData();
    for (const [key, value] of Object.entries(values)) {
      fd.append(key, value || "");
    }

    const fileFields = [
      "aadharFile",
      "panCardFile",
      "experienceLetter",
      "passportPhoto",
      "passbookFile",
    ];

    for (const fileField of fileFields) {
      const input = nativeForm.querySelector(
        `input[name="${fileField}"]`,
      ) as HTMLInputElement | null;
      if (input?.files?.[0]) {
        fd.append(fileField, input.files[0]);
      }
    }

    const academicInput = nativeForm.querySelector(
      "input[name=\"academicDocuments\"]",
    ) as HTMLInputElement | null;
    if (academicInput?.files) {
      for (const file of Array.from(academicInput.files)) {
        fd.append("academicDocuments", file);
      }
    }

    await onSubmit({ values, files: fd });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {/* ── Employee Info ─────────────────────────────────────── */}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        <h2 className="md:col-span-2 text-base font-bold text-slate-900 dark:text-white">
          Employee Info
        </h2>

        <Field label="Employee Name" error={errors.employeeName?.message}>
          <input className={fieldClass} {...register("employeeName")} />
        </Field>
        <Field label="Mobile Number" error={errors.mobileNumber?.message}>
          <input
            className={fieldClass}
            {...register("mobileNumber")}
            maxLength={10}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/[^0-9]/g, "");
            }}
          />
        </Field>
        <Field label="Alternate Number" error={errors.alternateNumber?.message}>
          <input
            className={fieldClass}
            {...register("alternateNumber")}
            maxLength={10}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/[^0-9]/g, "");
            }}
          />
        </Field>
        <Field label="Email ID" error={errors.email?.message}>
          <input className={fieldClass} type="email" {...register("email")} />
        </Field>

        {/* ── Designation (two dropdowns + fallback input) ── */}
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Designation
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Dropdown 1 — Department */}
            <div className="min-w-0">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Department
              </label>
              <select
                className={`${fieldClass} truncate pr-8`}
                value={deptCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">— Select Department —</option>
                <option value="Management">Management</option>
                <option value="Development">Development</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Dropdown 2 — Role (Management or Development) */}
            {(deptCategory === "Management" || deptCategory === "Development") && (
              <div className="min-w-0">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {deptCategory === "Management" ? "Management Role" : "Developer Role"}
                </label>
                <select
                  className={`${fieldClass} truncate pr-8`}
                  value={deptRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  <option value="">— Select Role —</option>
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.designation && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                    {errors.designation.message}
                  </p>
                )}
              </div>
            )}

            {/* Free-text input for Other / no category */}
            {(deptCategory === "Other" || deptCategory === "") && (
              <div className="min-w-0">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Designation Title
                </label>
                <input
                  className={fieldClass}
                  placeholder="e.g. CEO, Accountant…"
                  {...register("designation")}
                />
                {errors.designation && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                    {errors.designation.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <input type="hidden" {...register("role")} />
        <Field label="Access Role" error={errors.accessRole?.message}>
          <select className={`${fieldClass} truncate pr-8`} {...register("accessRole")}>
            {ACCESS_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Working Type" error={errors.workingType?.message}>
          <select className={`${fieldClass} truncate pr-8`} {...register("workingType")}>
            {WORKING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Assign Team Leader">
          <select
            className={`${fieldClass} truncate pr-8`}
            value={reportingTLId || ""}
            onChange={handleTLChange}
          >
            <option value="">— Unassigned —</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input type="hidden" {...register("reportingTLId")} />
          <input type="hidden" {...register("reportingTLName")} />
          <input type="hidden" {...register("reportingTLEmail")} />
        </Field>
      </section>

      {/* ── Address ───────────────────────────────────────────── */}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        <h2 className="md:col-span-2 text-base font-bold text-slate-900 dark:text-white">
          Address
        </h2>

        <Field label="Current Address" error={errors.currentAddress?.message}>
          <textarea className={fieldClass} rows={3} {...register("currentAddress")} />
        </Field>
        <Field label="Permanent Address" error={errors.permanentAddress?.message}>
          <textarea className={fieldClass} rows={3} {...register("permanentAddress")} />
        </Field>
        <Field label="Working Location" error={errors.workingLocation?.message}>
          <input className={fieldClass} {...register("workingLocation")} />
        </Field>
      </section>

      {/* ── Account Details ───────────────────────────────────── */}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        <h2 className="md:col-span-2 text-base font-bold text-slate-900 dark:text-white">
          Account Details
        </h2>

        <Field label="Account Holder Name" error={errors.accountHolderName?.message}>
          <input className={fieldClass} {...register("accountHolderName")} />
        </Field>
        <Field label="Account Number" error={errors.accountNumber?.message}>
          <input className={fieldClass} {...register("accountNumber")} />
        </Field>
        <Field label="IFSC Code" error={errors.ifscCode?.message}>
          <input
            className={fieldClass}
            {...register("ifscCode")}
            maxLength={11}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.toUpperCase();
            }}
          />
        </Field>
        <Field label="Bank Name" error={errors.bankName?.message}>
          <input className={fieldClass} {...register("bankName")} />
        </Field>
        <Field label="Passbook Upload">
          <input
            className={fileInputClass}
            type="file"
            name="passbookFile"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </Field>
      </section>

      {/* ── UPI Details ───────────────────────────────────────── */}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        <h2 className="md:col-span-2 text-base font-bold text-slate-900 dark:text-white">
          UPI Details
        </h2>

        <Field label="UPI ID" error={errors.upiId?.message}>
          <input className={fieldClass} placeholder="e.g. name@upi" {...register("upiId")} />
        </Field>
        <Field label="UPI Holder Name" error={errors.upiHolderName?.message}>
          <input className={fieldClass} {...register("upiHolderName")} />
        </Field>
      </section>

      {/* ── Document Upload ───────────────────────────────────── */}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        <h2 className="md:col-span-2 text-base font-bold text-slate-900 dark:text-white">
          Documents
        </h2>

        <Field label="Aadhar Number" error={errors.aadharNumber?.message}>
          <input
            className={fieldClass}
            {...register("aadharNumber")}
            maxLength={12}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/[^0-9]/g, "");
            }}
          />
        </Field>
        <Field label="Aadhar Card Upload">
          <input
            className={fileInputClass}
            type="file"
            name="aadharFile"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </Field>

        <Field label="PAN Card Number" error={errors.panNumber?.message}>
          <input
            className={fieldClass}
            placeholder="e.g. ABCDE1234F"
            {...register("panNumber")}
            maxLength={10}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.toUpperCase();
            }}
          />
        </Field>
        <Field label="PAN Card Upload">
          <input
            className={fileInputClass}
            type="file"
            name="panCardFile"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </Field>

        <Field label="Academic Documents">
          <input
            className={fileInputClass}
            type="file"
            name="academicDocuments"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </Field>
        <Field label="Experience Letter">
          <input
            className={fileInputClass}
            type="file"
            name="experienceLetter"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </Field>
        <Field label="Passport Size Photo">
          <input
            className={fileInputClass}
            type="file"
            name="passportPhoto"
            accept=".jpg,.jpeg,.png"
          />
        </Field>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
      >
        {loading ? "Saving..." : mode === "create" ? "Create Employee" : "Update Employee"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      {children}
      {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p> : null}
    </label>
  );
}

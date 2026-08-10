"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeFormValues } from "@/lib/employeeSchema";
import { ACCESS_ROLES, WORKING_MODES, WORKING_TYPES, MARITAL_STATUSES, RELATION_TYPES, type Employee } from "@/types/employee";
import {
  btnPrimary,
  formFile,
  formInput,
  formLabel,
  formSection,
  formSectionTitle,
  formSelect,
} from "@/components/ui/FormUi";

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

const IT_ROLES = [
  "IT Support Specialist",
  "System Administrator",
  "Network Engineer",
  "IT Manager",
  "Helpdesk Executive",
  "Database Administrator",
];

interface Department {
  _id: string;
  name: string;
  roles: string[];
  workingLocations: string[];
}

const fieldClass = formInput;
const selectClass = formSelect;
const fileInputClass = formFile;
const sectionClass = `${formSection} grid gap-4 md:grid-cols-2`;

const existingFileClass =
  "flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";

function guessCategory(designation: string): string {
  if (MANAGEMENT_ROLES.includes(designation)) return "Management";
  if (DEVELOPER_ROLES.includes(designation)) return "Development";
  if (designation === "Sales") return "Sales";
  if (IT_ROLES.includes(designation)) return "IT";
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
      dob: "",
      maritalStatus: "Single",
      bloodGroup: "",
      offeredSalary: 0,
      interviewDate: "",
      joiningDate: "",
      relationType: "Father",
      relativeName: "",
      designation: "",
      role: "Employee",
      accessRole: "Employee",
      workingType: "Full Time",
      workingMode: "Work From Home",
      officeLocation: "",
      currentAddress: "",
      permanentAddress: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      upiId: "",
      upiHolderName: "",
      aadharNumber: "",
      panNumber: "",
      reportingTLId: "",
      reportingTLName: "",
      reportingTLEmail: "",
    };
  }

  return {
    employeeName: initial.employeeName,
    mobileNumber: initial.mobileNumber,
    alternateNumber: initial.alternateNumber || "",
    email: initial.email,
    dob: initial.dob || "",
    maritalStatus: initial.maritalStatus || "Single",
    bloodGroup: initial.bloodGroup || "",
    offeredSalary: initial.offeredSalary || 0,
    interviewDate: initial.interviewDate || "",
    joiningDate: initial.joiningDate || "",
    relationType: initial.relationType || "Father",
    relativeName: initial.relativeName || "",
    designation: initial.designation,
    role: initial.role,
    accessRole: initial.accessRole,
    workingType: initial.workingType,
    workingMode: initial.workingMode || "Work From Home",
    officeLocation: initial.officeLocation || "",
    currentAddress: initial.address.currentAddress,
    permanentAddress: initial.address.permanentAddress,
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [globalRoles, setGlobalRoles] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/employees/managers")
      .then((res) => res.json())
      .then((data) => {
        setManagers(data.items || []);
      })
      .catch(console.error);

    fetch("/api/settings/departments")
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data || []);
      })
      .catch(console.error);

    fetch("/api/settings/roles")
      .then((res) => res.json())
      .then((data) => {
        setGlobalRoles(data || []);
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
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: defaults as any,
  });

  const reportingTLId = watch("reportingTLId");
  const workingMode = watch("workingMode");

  function handleCategoryChange(cat: string) {
    setDeptCategory(cat);
    setDeptRole("");
    if (cat === "Sales") {
      setValue("designation", "Sales", { shouldValidate: true });
    } else {
      setValue("designation", "", { shouldValidate: false });
    }
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
      setValue("reportingTLEmail", tl.email || ""); // Ensure email is in the API
    } else {
      setValue("reportingTLId", "");
      setValue("reportingTLName", "");
      setValue("reportingTLEmail", "");
    }
  }

  const selectedDept = departments.find(d => d.name === deptCategory);
  const roleOptions = selectedDept ? selectedDept.roles : globalRoles.map(r => r.name);

  const submit: SubmitHandler<EmployeeFormValues> = async (values, event) => {
    const nativeForm = event?.target as HTMLFormElement | undefined;
    if (!nativeForm) return;

    const fd = new FormData();
    for (const [key, value] of Object.entries(values)) {
      fd.append(key, value !== undefined && value !== null ? String(value) : "");
    }

    const fileFields = [
      { name: "aadharFile", label: "Aadhar Card", maxKb: 500, types: ["image/jpeg", "application/pdf"] },
      { name: "panCardFile", label: "PAN Card", maxKb: 500, types: ["image/jpeg", "application/pdf"] },
      { name: "experienceLetter", label: "Experience Letter", maxKb: 500, types: ["image/jpeg", "application/pdf"] },
      { name: "passbookFile", label: "Passbook", maxKb: 500, types: ["image/jpeg", "application/pdf"] },
      { name: "passportPhoto", label: "Passport Photo", maxKb: 250, types: ["image/jpeg", "image/png"] },
    ];

    for (const field of fileFields) {
      const input = nativeForm.querySelector(
        `input[name="${field.name}"]`,
      ) as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (file) {
        if (!field.types.includes(file.type)) {
          alert(`${field.label} must be ${field.types.join(" or ")}`);
          return;
        }
        if (file.size > field.maxKb * 1024) {
          alert(`${field.label} size must be less than ${field.maxKb}KB`);
          return;
        }
        fd.append(field.name, file);
      }
    }

    const academicInput = nativeForm.querySelector(
      "input[name=\"academicDocuments\"]",
    ) as HTMLInputElement | null;
    if (academicInput?.files) {
      for (const file of Array.from(academicInput.files)) {
        if (!["image/jpeg", "application/pdf"].includes(file.type)) {
          alert("Academic Documents must be JPG or PDF");
          return;
        }
        if (file.size > 500 * 1024) {
          alert("Each Academic Document must be less than 500KB");
          return;
        }
        fd.append("academicDocuments", file);
      }
    }

    await onSubmit({ values, files: fd });
  };

  return (
    <form onSubmit={handleSubmit(submit as any)} className="space-y-6">
      {/* ── Employee Info ─────────────────────────────────────── */}
      <section className={sectionClass}>
        <h2 className={`md:col-span-2 ${formSectionTitle}`}>
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
        <Field label="Alternate Number (Optional)" error={errors.alternateNumber?.message}>
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

        <Field label="Date of Birth" error={errors.dob?.message}>
          <input className={fieldClass} type="date" {...register("dob")} />
        </Field>

        <Field label="Marital Status" error={errors.maritalStatus?.message}>
          <select className={selectClass} {...register("maritalStatus")}>
            {MARITAL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Blood Group (Optional)" error={errors.bloodGroup?.message}>
          <input className={fieldClass} placeholder="e.g. A+, O-" {...register("bloodGroup")} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2">
          <Field label="Relation Type" error={errors.relationType?.message}>
            <select className={selectClass} {...register("relationType")}>
              {RELATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Relative Name" error={errors.relativeName?.message}>
            <input className={fieldClass} placeholder="Enter name" {...register("relativeName")} />
          </Field>
        </div>

        <Field label="Offered Salary (Optional)" error={errors.offeredSalary?.message}>
          <input className={fieldClass} type="number" {...register("offeredSalary")} />
        </Field>

        <Field label="Interview Date (Optional)" error={errors.interviewDate?.message}>
          <input className={fieldClass} type="date" {...register("interviewDate")} />
        </Field>

        <Field label="Joining Date" error={errors.joiningDate?.message}>
          <input className={fieldClass} type="date" {...register("joiningDate")} />
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
                className={selectClass}
                value={deptCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">— Select Department —</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Dropdown 2 — Role (Department roles or Global roles as fallback) */}
            {deptCategory === "Sales" && (
              <input type="hidden" {...register("designation")} value="Sales" />
            )}
            {deptCategory && deptCategory !== "Sales" && deptCategory !== "Other" && (
              <div className="min-w-0">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {deptCategory} Role
                </label>
                <select
                  className={selectClass}
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

            {/* Fallback Designation Title Input */}
            {(!deptCategory || deptCategory === "Other") && (
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
          <select className={selectClass} {...register("accessRole")}>
            <option value="">— Select Access Role —</option>
            {/* Default roles */}
            {["Admin", "HR", "TL", "Employee"].map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
            {/* Dynamic roles from Settings */}
            {globalRoles.map((role) => {
              // Avoid duplicates with default roles
              if (["Admin", "HR", "TL", "Employee"].includes(role.name)) return null;
              return (
                <option key={role._id} value={role.name}>
                  {role.name}
                </option>
              );
            })}
          </select>
        </Field>
        <Field label="Working Type" error={errors.workingType?.message}>
          <select className={selectClass} {...register("workingType")}>
            {WORKING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Working Mode" error={errors.workingMode?.message}>
          <select className={selectClass} {...register("workingMode")}>
            {WORKING_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </Field>
        
        {workingMode === "Office" && (
          <Field label="Office Name / Location" error={errors.officeLocation?.message}>
            <input
              className={fieldClass}
              placeholder="e.g. Noida Sector 62, Delhi HQ"
              {...register("officeLocation")}
            />
          </Field>
        )}

        <Field label="Assign Team Leader" error={errors.reportingTLId?.message}>
          <select
            className={selectClass}
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
      <section className={sectionClass}>
        <h2 className={`md:col-span-2 ${formSectionTitle}`}>
          Address
        </h2>

        <Field label="Current Address" error={errors.currentAddress?.message}>
          <textarea className={fieldClass} rows={3} {...register("currentAddress")} />
        </Field>
        <Field label="Permanent Address" error={errors.permanentAddress?.message}>
          <textarea className={fieldClass} rows={3} {...register("permanentAddress")} />
        </Field>
      </section>

      {/* ── Account Details ───────────────────────────────────── */}
      <section className={sectionClass}>
        <h2 className={`md:col-span-2 ${formSectionTitle}`}>
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
        <Field label="Passbook Upload(Optional)">
          <input
            className={fileInputClass}
            type="file"
            name="passbookFile"
            accept=".pdf,.jpg,.jpeg"
          />
          {mode === "edit" && initial?.documents?.passbookFile && (
            <FormFilePreview file={initial.documents.passbookFile} />
          )}
        </Field>
      </section>

      {/* ── UPI Details ───────────────────────────────────────── */}
      <section className={sectionClass}>
        <h2 className={`md:col-span-2 ${formSectionTitle}`}>
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
      <section className={sectionClass}>
        <h2 className={`md:col-span-2 ${formSectionTitle}`}>
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
            accept=".pdf,.jpg,.jpeg"
          />
          {mode === "edit" && initial?.documents?.aadharFile && (
            <FormFilePreview file={initial.documents.aadharFile} />
          )}
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
            accept=".pdf,.jpg,.jpeg"
          />
          {mode === "edit" && initial?.documents?.panCardFile && (
            <FormFilePreview file={initial.documents.panCardFile} />
          )}
        </Field>

        <Field label="Academic Documents">
          <input
            className={fileInputClass}
            type="file"
            name="academicDocuments"
            multiple
            accept=".pdf,.jpg,.jpeg"
          />
          {mode === "edit" && initial?.documents?.academicDocuments && initial.documents.academicDocuments.length > 0 && (
            <div className="mt-2 space-y-2">
              {initial.documents.academicDocuments.map((doc, idx) => (
                <FormFilePreview key={idx} file={doc} />
              ))}
            </div>
          )}
        </Field>
        <Field label="Experience Letter">
          <input
            className={fileInputClass}
            type="file"
            name="experienceLetter"
            accept=".pdf,.jpg,.jpeg"
          />
          {mode === "edit" && initial?.documents?.experienceLetter && (
            <FormFilePreview file={initial.documents.experienceLetter} />
          )}
        </Field>
        <Field label="Passport Size Photo">
          <input
            className={fileInputClass}
            type="file"
            name="passportPhoto"
            accept=".jpg,.jpeg,.png"
          />
          {mode === "edit" && initial?.documents?.passportPhoto && (
            <FormFilePreview file={initial.documents.passportPhoto} />
          )}
        </Field>
      </section>

      <button
        type="submit"
        disabled={loading}
        className={`${btnPrimary} px-8 py-3`}
      >
        {loading ? "Saving..." : mode === "create" ? "Create Employee" : "Update Employee"}
      </button>
    </form>
  );
}

function FormFilePreview({ file }: { file: { url: string; originalName: string } }) {
  const isImage = /\.(jpe?g|png|gif|webp)$/i.test(file.originalName);
  const isPdf = /\.pdf$/i.test(file.originalName);

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{isImage ? '📸' : isPdf ? '📄' : '📎'}</span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Currently Attached
            </span>
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 hover:underline truncate">
              {file.originalName}
            </a>
          </div>
        </div>
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700">
          <span className="text-sm">👁️</span>
          View Document
        </a>
      </div>
      
      {/* Visual Preview */}
      {isImage && (
        <div className="mt-2 w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <img src={file.url} alt={file.originalName} className="w-full h-auto object-contain max-h-48 hover:opacity-90 transition-opacity" />
          </a>
        </div>
      )}
      {isPdf && (
        <div className="mt-2 w-full h-64 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <iframe src={`${file.url}#toolbar=0`} className="w-full h-full" title={file.originalName} />
        </div>
      )}
    </div>
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
    <label className="block min-w-0">
      <span className={formLabel}>{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
    </label>
  );
}

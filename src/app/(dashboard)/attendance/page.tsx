"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Calculator, ExternalLink, IndianRupee, RotateCcw, Save, Trash2, Eye, X } from "lucide-react";
import toast from "react-hot-toast";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { btnPrimary, btnSecondary, formInput, formLabel } from "@/components/ui/FormUi";
import { fetchJsonCached } from "@/lib/clientDataCache";

type EmployeeOption = {
  _id: string;
  employeeName: string;
  mobileNumber?: string;
  email?: string;
  offeredSalary?: number;
  designation?: string;
};

type SalaryForm = {
  selectedKey: string;
  employeeName: string;
  month: string;
  monthlySalary: number;
  monthDays: number;
  unpaidLeaves: number;
  bonusAmount: number;
  bonusDays: number;
  deductionAmount: number;
  deductionDays: number;
};

type SavedCalculation = {
  _id: string;
  employeeId?: string;
  employeeName: string;
  monthLabel: string;
  monthlySalary: number;
  monthDays: number;
  unpaidLeaves: number;
  bonusAmount: number;
  bonusDays: number;
  deductionAmount: number;
  deductionDays: number;
  perDaySalary: number;
  payableDays: number;
  earnedSalary: number;
  bonusFromDays: number;
  totalBonus: number;
  deductionFromDays: number;
  totalDeductions: number;
  netSalary: number;
  createdAt: string;
};

const initialForm: SalaryForm = {
  selectedKey: "",
  employeeName: "",
  month: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
  monthlySalary: 0,
  monthDays: 30,
  unpaidLeaves: 0,
  bonusAmount: 0,
  bonusDays: 0,
  deductionAmount: 0,
  deductionDays: 0,
};

function employeeKey(emp: EmployeeOption) {
  return `${emp.employeeName}|${emp.mobileNumber || ""}`;
}

function employeeLabel(emp: EmployeeOption, duplicateNames: Set<string>) {
  if (duplicateNames.has(emp.employeeName)) {
    const extra = emp.mobileNumber || emp.designation || "";
    return extra ? `${emp.employeeName} · ${extra}` : emp.employeeName;
  }
  return emp.employeeName;
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function AttendancePayrollPage() {
  const [form, setForm] = useState<SalaryForm>(initialForm);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [savedRecords, setSavedRecords] = useState<SavedCalculation[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewRecord, setViewRecord] = useState<SavedCalculation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch("/api/salary-calculations?limit=50");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load saved records");
      setSavedRecords(data.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load saved records");
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    fetchJsonCached<{ items: EmployeeOption[] }>("/api/employees?lite=1&limit=500")
      .then((data) => setEmployees(data.items || []))
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmployees(false));
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const emp of employees) {
      counts.set(emp.employeeName, (counts.get(emp.employeeName) || 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name));
  }, [employees]);

  const selectedEmployee = useMemo(
    () => employees.find((emp) => employeeKey(emp) === form.selectedKey) ?? null,
    [employees, form.selectedKey],
  );

  const result = useMemo(() => {
    const monthDays = Math.max(1, form.monthDays || 30);
    const unpaidLeaves = Math.min(Math.max(0, form.unpaidLeaves || 0), monthDays);
    const payableDays = Math.max(0, monthDays - unpaidLeaves);
    const perDaySalary = (form.monthlySalary || 0) / monthDays;
    const earnedSalary = perDaySalary * payableDays;
    const bonusFromDays = perDaySalary * Math.max(0, form.bonusDays || 0);
    const totalBonus = Math.max(0, form.bonusAmount || 0) + bonusFromDays;
    const deductionFromDays = perDaySalary * Math.max(0, form.deductionDays || 0);
    const totalDeductions = Math.max(0, form.deductionAmount || 0) + deductionFromDays;
    const netSalary = Math.max(0, earnedSalary + totalBonus - totalDeductions);

    return {
      monthDays,
      unpaidLeaves,
      payableDays,
      perDaySalary,
      earnedSalary,
      bonusFromDays,
      totalBonus,
      deductionFromDays,
      totalDeductions,
      netSalary,
    };
  }, [form]);

  const update = (key: keyof SalaryForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]:
        key === "employeeName" || key === "month" || key === "selectedKey"
          ? value
          : Number(value) || 0,
    }));
  };

  const selectEmployee = (key: string) => {
    const employee = employees.find((e) => employeeKey(e) === key);
    setForm((prev) => ({
      ...prev,
      selectedKey: key,
      employeeName: employee?.employeeName || "",
      monthlySalary: employee?.offeredSalary || 0,
    }));
  };

  const handleSave = async () => {
    if (!form.selectedKey || !form.employeeName) {
      toast.error("Select an employee first");
      return;
    }
    if (!form.monthlySalary) {
      toast.error("Enter monthly salary");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/salary-calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee?._id,
          employeeName: form.employeeName,
          monthLabel: form.month,
          monthlySalary: form.monthlySalary,
          monthDays: result.monthDays,
          unpaidLeaves: result.unpaidLeaves,
          bonusAmount: form.bonusAmount,
          bonusDays: form.bonusDays,
          deductionAmount: form.deductionAmount,
          deductionDays: form.deductionDays,
          perDaySalary: result.perDaySalary,
          payableDays: result.payableDays,
          earnedSalary: result.earnedSalary,
          bonusFromDays: result.bonusFromDays,
          totalBonus: result.totalBonus,
          deductionFromDays: result.deductionFromDays,
          totalDeductions: result.totalDeductions,
          netSalary: result.netSalary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Salary calculation save ho gayi");
      loadSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this saved calculation?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/salary-calculations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted");
      setSavedRecords((prev) => prev.filter((r) => r._id !== id));
      if (viewRecord?._id === id) setViewRecord(null);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const loadIntoForm = (record: SavedCalculation) => {
    const emp =
      employees.find((e) => e._id === record.employeeId) ??
      employees.find((e) => e.employeeName === record.employeeName);
    setForm({
      selectedKey: emp ? employeeKey(emp) : "",
      employeeName: record.employeeName,
      month: record.monthLabel,
      monthlySalary: record.monthlySalary,
      monthDays: record.monthDays,
      unpaidLeaves: record.unpaidLeaves,
      bonusAmount: record.bonusAmount,
      bonusDays: record.bonusDays,
      deductionAmount: record.deductionAmount,
      deductionDays: record.deductionDays,
    });
    setViewRecord(null);
    toast.success("Loaded into form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "People & HR" },
            { label: "Salary Calculator" },
          ]}
        />

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                People & HR
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                Simple Salary Calculator
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Select an employee, calculate salary, and save — view full details anytime later.
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-600 text-white">
              <Calculator className="size-6" />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Salary Details</h2>
                <p className="text-xs text-slate-500">Select employee name from the dropdown — details below will update for verification.</p>
              </div>
              <button type="button" onClick={() => setForm(initialForm)} className={btnSecondary}>
                <RotateCcw className="size-4" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee Name" required className="sm:col-span-2">
                <select
                  className={formInput}
                  value={form.selectedKey}
                  onChange={(e) => selectEmployee(e.target.value)}
                  disabled={loadingEmployees}
                >
                  <option value="">
                    {loadingEmployees ? "Loading employees..." : "Select employee name"}
                  </option>
                  {employees.map((emp) => (
                    <option key={employeeKey(emp)} value={employeeKey(emp)}>
                      {employeeLabel(emp, duplicateNames)}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedEmployee ? (
                <div className="sm:col-span-2 rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                        Selected Employee
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {selectedEmployee.employeeName}
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        {selectedEmployee.designation ? (
                          <p>
                            <span className="font-medium">Designation:</span> {selectedEmployee.designation}
                          </p>
                        ) : null}
                        {selectedEmployee.mobileNumber ? (
                          <p>
                            <span className="font-medium">Mobile:</span> {selectedEmployee.mobileNumber}
                          </p>
                        ) : null}
                        {selectedEmployee.email ? (
                          <p>
                            <span className="font-medium">Email:</span> {selectedEmployee.email}
                          </p>
                        ) : null}
                        <p>
                          <span className="font-medium">Offered Salary:</span>{" "}
                          {selectedEmployee.offeredSalary
                            ? money(selectedEmployee.offeredSalary)
                            : "Not set — enter manually below"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/employees/${selectedEmployee._id}/view`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300 bg-white px-3 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:border-cyan-800 dark:bg-slate-900 dark:text-cyan-200 dark:hover:bg-slate-800"
                    >
                      Full profile
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ) : null}

              <Field label="Month">
                <input
                  className={formInput}
                  value={form.month}
                  onChange={(e) => update("month", e.target.value)}
                  placeholder="June 2026"
                />
              </Field>

              <Field label="Monthly Salary" required>
                <MoneyInput
                  value={form.monthlySalary}
                  onChange={(value) => update("monthlySalary", value)}
                  placeholder="30000"
                />
              </Field>

              <Field label="Total Days in Month" required>
                <input
                  className={formInput}
                  type="number"
                  min={1}
                  value={form.monthDays || ""}
                  onChange={(e) => update("monthDays", e.target.value)}
                />
              </Field>

              <Field label="Unpaid Leaves (days)">
                <input
                  className={formInput}
                  type="number"
                  min={0}
                  value={form.unpaidLeaves || ""}
                  onChange={(e) => update("unpaidLeaves", e.target.value)}
                  placeholder="0"
                />
              </Field>

              <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Bonus / Incentive
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="By Days">
                    <DayInput
                      value={form.bonusDays}
                      onChange={(value) => update("bonusDays", value)}
                      hint={form.bonusDays > 0 ? `= ${money(result.bonusFromDays)}` : undefined}
                    />
                  </Field>
                  <Field label="By Amount (₹)">
                    <MoneyInput
                      value={form.bonusAmount}
                      onChange={(value) => update("bonusAmount", value)}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Other Deductions
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="By Days">
                    <DayInput
                      value={form.deductionDays}
                      onChange={(value) => update("deductionDays", value)}
                      hint={form.deductionDays > 0 ? `= ${money(result.deductionFromDays)}` : undefined}
                    />
                  </Field>
                  <Field label="By Amount (₹)">
                    <MoneyInput
                      value={form.deductionAmount}
                      onChange={(value) => update("deductionAmount", value)}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:sticky lg:top-6">
            <div className="rounded-2xl bg-slate-950 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Net Salary
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">
                {money(result.netSalary)}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {form.employeeName || "Employee"} · {form.month}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <SummaryRow label="Per Day Salary" value={money(result.perDaySalary)} />
              <SummaryRow label="Total Month Days" value={`${result.monthDays} days`} />
              <SummaryRow label="Unpaid Leaves" value={`${result.unpaidLeaves} days`} negative />
              <SummaryRow label="Payable Days" value={`${result.payableDays} days`} positive />
              <SummaryRow label="Earned Salary" value={money(result.earnedSalary)} />
              {form.bonusDays > 0 ? (
                <SummaryRow
                  label={`Bonus (${form.bonusDays} days)`}
                  value={`+ ${money(result.bonusFromDays)}`}
                  positive
                />
              ) : null}
              {form.bonusAmount > 0 ? (
                <SummaryRow label="Bonus (₹ amount)" value={`+ ${money(form.bonusAmount)}`} positive />
              ) : null}
              <SummaryRow label="Total Bonus" value={`+ ${money(result.totalBonus)}`} positive />
              {form.deductionDays > 0 ? (
                <SummaryRow
                  label={`Deduction (${form.deductionDays} days)`}
                  value={`- ${money(result.deductionFromDays)}`}
                  negative
                />
              ) : null}
              {form.deductionAmount > 0 ? (
                <SummaryRow label="Deduction (₹ amount)" value={`- ${money(form.deductionAmount)}`} negative />
              ) : null}
              <SummaryRow label="Total Deductions" value={`- ${money(result.totalDeductions)}`} negative />
            </div>

            <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-200">
              Formula:{" "}
              <strong>
                (Monthly Salary ÷ Month Days × Payable Days) + Bonus (days × per day + ₹) − Deductions (days × per day + ₹)
              </strong>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`${btnPrimary} mt-5 flex w-full items-center justify-center gap-2`}
            >
              <Save className="size-4" />
              {saving ? "Saving…" : "Save Calculation"}
            </button>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Saved Calculations</h2>
              <p className="text-xs text-slate-500">All saved calculations with full details appear here.</p>
            </div>
            <button type="button" onClick={loadSaved} className={btnSecondary}>
              Refresh
            </button>
          </div>

          {loadingSaved ? (
            <p className="text-sm text-slate-500">Loading saved records…</p>
          ) : savedRecords.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
              No saved calculations yet. Calculate and click Save.
            </p>
          ) : (
            <div className="space-y-3">
              {savedRecords.map((record) => (
                <div
                  key={record._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{record.employeeName}</p>
                    <p className="text-xs text-slate-500">
                      {record.monthLabel} · Saved{" "}
                      {new Date(record.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {money(record.netSalary)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewRecord(record)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
                    >
                      <Eye className="size-3.5" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => loadIntoForm(record)}
                      className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-200"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(record._id)}
                      disabled={deletingId === record._id}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {viewRecord ? (
          <SavedDetailModal
            record={viewRecord}
            onClose={() => setViewRecord(null)}
            onLoad={() => loadIntoForm(viewRecord)}
            money={money}
          />
        ) : null}
      </div>
    </div>
  );
}

function SavedDetailModal({
  record,
  onClose,
  onLoad,
  money,
}: {
  record: SavedCalculation;
  onClose: () => void;
  onLoad: () => void;
  money: (value: number) => string;
}) {
  const rows: [string, string][] = [
    ["Employee", record.employeeName],
    ["Month", record.monthLabel],
    ["Monthly Salary", money(record.monthlySalary)],
    ["Total Days in Month", `${record.monthDays} days`],
    ["Unpaid Leaves", `${record.unpaidLeaves} days`],
    ["Payable Days", `${record.payableDays} days`],
    ["Per Day Salary", money(record.perDaySalary)],
    ["Earned Salary", money(record.earnedSalary)],
    ["Bonus (days)", `${record.bonusDays} days = ${money(record.bonusFromDays)}`],
    ["Bonus (₹)", money(record.bonusAmount)],
    ["Total Bonus", money(record.totalBonus)],
    ["Deduction (days)", `${record.deductionDays} days = ${money(record.deductionFromDays)}`],
    ["Deduction (₹)", money(record.deductionAmount)],
    ["Total Deductions", money(record.totalDeductions)],
    ["Net Salary", money(record.netSalary)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">Saved Details</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{record.employeeName}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
            >
              <span className="text-slate-500">{label}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onLoad} className={`${btnPrimary} flex-1`}>
            Load into form
          </button>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={formLabel}>
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        className={`${formInput} pl-10`}
        type="number"
        min={0}
        step="any"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function DayInput({
  value,
  onChange,
  hint,
}: {
  value: number;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <input
        className={formInput}
        type="number"
        min={0}
        step="0.5"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0 days"
      />
      {hint ? <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <span
        className={`text-sm font-bold ${
          positive
            ? "text-emerald-600 dark:text-emerald-400"
            : negative
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-900 dark:text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

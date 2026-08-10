"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { DataTable, PageShell, btnPrimary, type Column } from "@/components/modules/DataTable";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";
import { EmptyState } from "@/components/modules/EmptyState";
import toast from "react-hot-toast";

const mod = MODULE_REGISTRY.reports;

const REPORT_TYPES = [
  { id: "customer", label: "Customers" },
  { id: "staff", label: "Staff" },
  { id: "sales", label: "Sales Leads" },
  { id: "projects", label: "Projects" },
  { id: "payments", label: "Customer Payments" },
  { id: "payment-ledger", label: "Payment Summary" },
  { id: "expense", label: "Expenses" },
  { id: "salary", label: "Salary" },
  { id: "maintenance", label: "Maintenance" },
  { id: "allocations", label: "Staff Allocation" },
] as const;

type ReportType = (typeof REPORT_TYPES)[number]["id"];

type ReportRow = Record<string, unknown>;

const COLUMN_MAP: Record<ReportType, { key: string; label: string }[]> = {
  customer: [
    { key: "name", label: "Name" },
    { key: "mobileNumber", label: "Mobile" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
    { key: "assignedStaffName", label: "Assigned Staff" },
  ],
  staff: [
    { key: "employeeName", label: "Name" },
    { key: "email", label: "Email" },
    { key: "designation", label: "Designation" },
    { key: "accessRole", label: "Role" },
  ],
  sales: [
    { key: "name", label: "Lead" },
    { key: "phone", label: "Phone" },
    { key: "company", label: "Company" },
    { key: "status", label: "Status" },
    { key: "source", label: "Source" },
  ],
  projects: [
    { key: "name", label: "Project" },
    { key: "status", label: "Status" },
    { key: "budget", label: "Budget" },
    { key: "description", label: "Description" },
  ],
  payments: [
    { key: "invoiceNumber", label: "Invoice" },
    { key: "paymentType", label: "Type" },
    { key: "totalAmount", label: "Total" },
    { key: "paidAmount", label: "Paid" },
    { key: "dueAmount", label: "Due" },
    { key: "status", label: "Status" },
  ],
  "payment-ledger": [
    { key: "ledgerType", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "totalAmount", label: "Total" },
    { key: "paidAmount", label: "Paid" },
    { key: "employeeName", label: "Employee" },
    { key: "status", label: "Status" },
  ],
  expense: [
    { key: "type", label: "Expense Type" },
    { key: "employeeName", label: "Employee" },
    { key: "category", label: "Category" },
    { key: "title", label: "Title" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
  ],
  salary: [
    { key: "employeeName", label: "Employee" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
    { key: "netSalary", label: "Net Salary" },
    { key: "status", label: "Status" },
  ],
  maintenance: [
    { key: "title", label: "Service" },
    { key: "serviceType", label: "Type" },
    { key: "status", label: "Status" },
    { key: "renewalDate", label: "Renewal" },
  ],
  allocations: [
    { key: "employeeName", label: "Employee" },
    { key: "projectName", label: "Project" },
    { key: "role", label: "Role" },
    { key: "allocationPercent", label: "%" },
  ],
};

function formatCell(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString();
  if (value instanceof Date) return value.toLocaleDateString();
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return new Date(s).toLocaleDateString();
  return s;
}

function buildColumns(type: ReportType, rows: ReportRow[]): Column<ReportRow>[] {
  const mapped = COLUMN_MAP[type] || [];
  if (mapped.length) {
    return mapped.map((col) => ({
      key: col.key,
      label: col.label,
      render: (row) => formatCell(row[col.key]),
    }));
  }
  const sample = rows[0];
  if (!sample) return [];
  return Object.keys(sample)
    .filter((k) => !k.startsWith("_") && k !== "__v" && k !== "deletedAt")
    .slice(0, 8)
    .map((key) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
      render: (row) => formatCell(row[key]),
    }));
}

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>("customer");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async (reportType: ReportType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}&format=json`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Report failed");
      setRows((data.items as ReportRow[]) || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Report failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(type);
  }, [type, loadReport]);

  const columns = useMemo(() => buildColumns(type, rows), [type, rows]);

  const exportCsv = async () => {
    try {
      const res = await fetch(`/api/reports?type=${type}&format=csv`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.csv`;
      a.click();
      toast.success("CSV downloaded");
    } catch {
      toast.error("CSV export failed");
    }
  };

  return (
    <PageShell
      title={mod.title}
      subtitle="Select a report — data will appear in the table below"
      breadcrumbs={<Breadcrumb items={moduleBreadcrumbs(mod.route)} />}
    >
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Report Type</label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
            className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            {REPORT_TYPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <button type="button" disabled={loading} onClick={() => loadReport(type)} className={btnPrimary}>
            Refresh
          </button>
          <button
            type="button"
            disabled={loading || rows.length === 0}
            onClick={exportCsv}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600"
          >
            Export CSV
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">{rows.length} records</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Loading report…
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No data" description="No records found for this report type yet." />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) =>
            String(row._id || row.id || `${type}-${row.name || row.title || row.employeeName || rows.indexOf(row)}`)
          }
        />
      )}
    </PageShell>
  );
}

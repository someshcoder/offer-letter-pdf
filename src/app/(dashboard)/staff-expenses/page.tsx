"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchJsonCached } from "@/lib/clientDataCache";
import { FinanceFlowGuide } from "@/components/modules/FinanceFlowGuide";
import { ModuleCrudPage, StatusBadge } from "@/components/modules/ModuleCrudPage";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES } from "@/types/modules/constants";

const mod = MODULE_REGISTRY.staffExpenses;

type Expense = {
  _id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  amount: number;
  status: string;
  expenseDate: string;
  description?: string;
};

export default function StaffExpensesPage() {
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetchJsonCached<{ items?: Array<{ _id: string; employeeName: string }> }>("/api/employees?lite=1")
      .then((data) => {
        setEmployees((data.items || []).map((e) => ({ value: e._id, label: e.employeeName })));
      })
      .catch(() => {});
  }, []);

  return (
    <ModuleCrudPage<Expense>
      title={mod.title}
      subtitle="Employee travel, food, fuel — approve and pay reimbursements"
      apiPath={mod.api}
      breadcrumbs={moduleBreadcrumbs(mod.route)}
      getRowId={(r) => r._id}
      headerExtra={<FinanceFlowGuide page="staff-expenses" />}
      hiddenFieldKeys={["employeeName"]}
      onFieldChange={(key, value, setForm) => {
        if (key !== "employeeId") return;
        const emp = employees.find((e) => e.value === value);
        setForm((prev) => ({ ...prev, employeeName: emp?.label || "" }));
      }}
      statusOptions={[{ value: "All", label: "All" }, ...EXPENSE_STATUSES.map((s) => ({ value: s, label: s }))]}
      fields={[
        { key: "employeeId", label: "Employee Name", type: "select", options: employees, required: true },
        { key: "category", label: "Category", type: "select", options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })), required: true },
        { key: "amount", label: "Amount (₹)", type: "number", required: true },
        { key: "expenseDate", label: "Date", type: "date" },
        { key: "description", label: "What was this expense for?", type: "textarea" },
      ]}
      columns={[
        { key: "employeeName", label: "Employee" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", render: (r) => `₹${r.amount.toLocaleString()}` },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      extraActions={(row, reload) =>
        row.status === "Pending" ? (
          <button
            type="button"
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
            onClick={async () => {
              const res = await fetch(`/api/staff-expenses?id=${row._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Approved" }),
              });
              if (!res.ok) return toast.error("Approval failed");
              toast.success("Approved — will appear in the ledger");
              reload();
            }}
          >
            Approve
          </button>
        ) : null
      }
    />
  );
}

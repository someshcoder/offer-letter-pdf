"use client";

import { useEffect, useState } from "react";
import { fetchJsonCached } from "@/lib/clientDataCache";
import { ModuleCrudPage, StatusBadge } from "@/components/modules/ModuleCrudPage";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/types/modules/constants";
import toast from "react-hot-toast";

const mod = MODULE_REGISTRY.tasks;

type TaskRow = { _id: string; title: string; priority: string; status: string; dueDate?: string; progress: number };
type EmployeeOption = { _id: string; employeeName: string };

export default function TasksPage() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  useEffect(() => {
    fetchJsonCached<{ items?: EmployeeOption[] }>("/api/employees?lite=1&limit=200")
      .then((data) => setEmployees(data.items || []))
      .catch(() => setEmployees([]));
  }, []);

  return (
    <ModuleCrudPage<TaskRow>
      title={mod.title}
      subtitle="Assign tasks, track progress, and comments"
      apiPath={mod.api}
      breadcrumbs={moduleBreadcrumbs(mod.route)}
      getRowId={(r) => r._id}
      statusOptions={[{ value: "All", label: "All" }, ...TASK_STATUSES.map((s) => ({ value: s, label: s }))]}
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "priority", label: "Priority", type: "select", options: TASK_PRIORITIES.map((p) => ({ value: p, label: p })) },
        { key: "status", label: "Status", type: "select", options: TASK_STATUSES.map((s) => ({ value: s, label: s })) },
        { key: "assignedStaffIds", label: "Assign To", type: "select", options: employees.map((employee) => ({ value: employee._id, label: employee.employeeName })) },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "dueDate", label: "Due Date", type: "date" },
        { key: "progress", label: "Progress %", type: "number" },
      ]}
      columns={[
        { key: "title", label: "Task" },
        { key: "priority", label: "Priority", render: (r) => <StatusBadge status={r.priority} /> },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "dueDate", label: "Due", render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—" },
        { key: "progress", label: "Progress", render: (r) => `${r.progress || 0}%` },
      ]}
      extraActions={(row, reload) =>
        row.status !== "Completed" ? (
          <button type="button" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white" onClick={async () => {
            const res = await fetch(`/api/tasks?id=${row._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Completed", progress: 100 }) });
            if (!res.ok) return toast.error("Failed");
            toast.success("Task completed");
            reload();
          }}>Complete</button>
        ) : null
      }
    />
  );
}

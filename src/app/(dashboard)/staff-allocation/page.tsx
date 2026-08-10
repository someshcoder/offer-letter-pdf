"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchJsonCached } from "@/lib/clientDataCache";
import { loadCustomerProject } from "@/lib/modules/customerProject";
import { ModuleCrudPage } from "@/components/modules/ModuleCrudPage";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";

const mod = MODULE_REGISTRY.staffAllocation;

type Allocation = {
  _id: string;
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  role: string;
  allocationPercent: number;
};

export default function StaffAllocationPage() {
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetchJsonCached<{ items?: Array<{ _id: string; name: string }> }>("/api/clients?lite=1"),
      fetchJsonCached<{ items?: Array<{ _id: string; employeeName: string }> }>("/api/employees?lite=1"),
    ])
      .then(([cd, ed]) => {
        setClients((cd.items || []).map((x) => ({ value: x._id, label: x.name })));
        setEmployees((ed.items || []).map((x) => ({ value: x._id, label: x.employeeName })));
      })
      .catch(() => {});
  }, []);

  return (
    <ModuleCrudPage<Allocation>
      title={mod.title}
      subtitle="Assign staff to projects"
      apiPath={mod.api}
      breadcrumbs={moduleBreadcrumbs(mod.route)}
      getRowId={(r) => r._id}
      hiddenFieldKeys={["employeeName", "projectId"]}
      fetchEditForm={async (row) => {
        const res = await fetch(`/api/projects/${row.projectId}`, { cache: "no-store" });
        const data = await res.json();
        const project = data.item;
        return {
          clientId: project?.clientId ? String(project.clientId) : "",
          employeeId: String(row.employeeId || ""),
          employeeName: row.employeeName || "",
          projectId: String(row.projectId || ""),
          projectName: row.projectName || project?.name || "",
          role: row.role || "",
          allocationPercent: String(row.allocationPercent ?? ""),
        };
      }}
      onFieldChange={(key, value, setForm) => {
        if (key === "employeeId") {
          const emp = employees.find((e) => e.value === value);
          setForm((prev) => ({ ...prev, employeeName: emp?.label || "" }));
        }
        if (key === "clientId") {
          if (!value) {
            setForm((prev) => ({ ...prev, projectId: "", projectName: "" }));
            return;
          }
          loadCustomerProject(value)
            .then((project) => {
              if (!project) {
                toast.error("No project found for this customer");
                setForm((prev) => ({ ...prev, projectId: "", projectName: "" }));
                return;
              }
              setForm((prev) => ({
                ...prev,
                projectId: project._id,
                projectName: project.name,
              }));
            })
            .catch(() => toast.error("Could not load project"));
        }
      }}
      transformPayload={(payload, form) => {
        if (!form.projectId) {
          throw new Error("Select a customer first — project will auto-fill");
        }
        const { clientId: _clientId, ...rest } = payload;
        return rest;
      }}
      fields={[
        { key: "clientId", label: "Customer", type: "select", options: clients, required: true },
        { key: "employeeId", label: "Employee Name", type: "select", options: employees, required: true },
        { key: "projectName", label: "Project", readOnly: true, required: true },
        { key: "role", label: "Role" },
        { key: "allocationPercent", label: "Allocation %", type: "number" },
      ]}
      columns={[
        { key: "employeeName", label: "Employee Name" },
        { key: "projectName", label: "Project" },
        { key: "role", label: "Role" },
        { key: "allocationPercent", label: "%", render: (r) => `${r.allocationPercent}%` },
      ]}
    />
  );
}

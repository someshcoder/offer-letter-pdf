"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchJsonCached } from "@/lib/clientDataCache";
import { loadCustomerProject } from "@/lib/modules/customerProject";
import { ModuleCrudPage, StatusBadge } from "@/components/modules/ModuleCrudPage";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";
import { SERVICE_STATUSES, SERVICE_TYPES } from "@/types/modules/constants";

const mod = MODULE_REGISTRY.maintenance;

type Service = {
  _id: string;
  clientId?: string;
  projectId?: string;
  title: string;
  serviceType: string;
  status: string;
  renewalDate?: string;
  startDate?: string;
  expiryDate?: string;
  description?: string;
};

export default function MaintenancePage() {
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetchJsonCached<{ items?: Array<{ _id: string; name: string }> }>("/api/clients?lite=1")
      .then((data) => {
        setClients((data.items || []).map((c) => ({ value: c._id, label: c.name })));
      })
      .catch(() => {});
  }, []);

  return (
    <ModuleCrudPage<Service>
      title={mod.title}
      subtitle="Maintenance requests and monthly services"
      apiPath={mod.api}
      breadcrumbs={moduleBreadcrumbs(mod.route)}
      getRowId={(r) => r._id}
      hiddenFieldKeys={["projectId"]}
      fetchEditForm={async (row) => {
        let projectName = "";
        if (row.projectId) {
          const res = await fetch(`/api/projects/${row.projectId}`, { cache: "no-store" });
          const data = await res.json();
          projectName = data.item?.name || "";
        }
        return {
          clientId: String(row.clientId || ""),
          projectId: String(row.projectId || ""),
          projectName,
          title: row.title || "",
          serviceType: row.serviceType || "Maintenance Request",
          status: row.status || "Pending",
          startDate: row.startDate ? String(row.startDate).slice(0, 10) : "",
          expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : "",
          renewalDate: row.renewalDate ? String(row.renewalDate).slice(0, 10) : "",
          description: row.description || "",
        };
      }}
      onFieldChange={(key, value, setForm) => {
        if (key !== "clientId") return;
        if (!value) {
          setForm((prev) => ({ ...prev, projectId: "", projectName: "" }));
          return;
        }
        loadCustomerProject(value)
          .then((project) => {
            if (!project) {
              toast.error("No project found for this customer — create one in Projects first");
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
      }}
      transformPayload={(payload) => {
        const { projectName: _projectName, ...rest } = payload;
        return rest;
      }}
      statusOptions={[{ value: "All", label: "All" }, ...SERVICE_STATUSES.map((s) => ({ value: s, label: s }))]}
      fields={[
        { key: "clientId", label: "Customer", type: "select", options: clients, required: true },
        { key: "projectName", label: "Project", readOnly: true },
        { key: "title", label: "Title", required: true },
        { key: "serviceType", label: "Type", type: "select", options: SERVICE_TYPES.map((t) => ({ value: t, label: t })) },
        { key: "status", label: "Status", type: "select", options: SERVICE_STATUSES.map((s) => ({ value: s, label: s })) },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "expiryDate", label: "Expiry Date", type: "date" },
        { key: "renewalDate", label: "Renewal Date", type: "date" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      columns={[
        { key: "title", label: "Service" },
        { key: "serviceType", label: "Type" },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "renewalDate", label: "Renewal", render: (r) => (r.renewalDate ? new Date(r.renewalDate).toLocaleDateString() : "—") },
      ]}
    />
  );
}

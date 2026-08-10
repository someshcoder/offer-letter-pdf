"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchJsonCached } from "@/lib/clientDataCache";
import { loadCustomerProject } from "@/lib/modules/customerProject";
import { ModuleCrudPage, StatusBadge } from "@/components/modules/ModuleCrudPage";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";

const mod = MODULE_REGISTRY.domains;

type DomainRow = {
  _id: string;
  clientId?: string;
  projectId?: string;
  domainName: string;
  registrar?: string;
  expiryDate?: string;
  purchaseDate?: string;
  hostingProvider?: string;
  notes?: string;
  status: string;
};

export default function DomainsPage() {
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetchJsonCached<{ items?: Array<{ _id: string; name: string }> }>("/api/clients?lite=1")
      .then((data) => {
        setClients((data.items || []).map((c) => ({ value: c._id, label: c.name })));
      })
      .catch(() => {});
  }, []);

  return (
    <ModuleCrudPage<DomainRow>
      title={mod.title}
      subtitle="Track domains, expiry, and hosting"
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
          domainName: row.domainName || "",
          registrar: row.registrar || "",
          purchaseDate: row.purchaseDate ? String(row.purchaseDate).slice(0, 10) : "",
          expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : "",
          hostingProvider: row.hostingProvider || "",
          notes: row.notes || "",
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
      fields={[
        { key: "clientId", label: "Customer", type: "select", options: clients, required: true },
        { key: "projectName", label: "Project", readOnly: true },
        { key: "domainName", label: "Domain Name", required: true },
        { key: "registrar", label: "Registrar" },
        { key: "purchaseDate", label: "Purchase Date", type: "date" },
        { key: "expiryDate", label: "Expiry Date", type: "date" },
        { key: "hostingProvider", label: "Hosting Provider" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "domainName", label: "Domain" },
        { key: "registrar", label: "Registrar" },
        { key: "expiryDate", label: "Expiry", render: (r) => (r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "—") },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}

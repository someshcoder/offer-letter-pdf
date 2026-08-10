"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ModuleCrudPage, StatusBadge } from "@/components/modules/ModuleCrudPage";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";
import { toDateInputValue } from "@/lib/modules/dateUtils";
import { PAYMENT_TYPES, PROJECT_STATUSES, SERVICE_TYPES } from "@/types/modules/constants";

type Project = {
  _id: string;
  name: string;
  clientId: string;
  budget?: number;
  status: string;
  createdAt: string;
};

const mod = MODULE_REGISTRY.projects;

async function loadProjectForm(row: Project): Promise<Record<string, string>> {
  const res = await fetch(`/api/projects/${row._id}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load project");

  const p = data.item;
  const domain = data.domains?.[0];
  const payment = data.payments?.[0];
  const maintenance = data.maintenance?.[0];

  return {
    name: p.name || "",
    clientId: String(p.clientId || ""),
    description: p.description || "",
    budget: String(p.budget ?? ""),
    status: p.status || "Pending Allocation",
    domainName: domain?.domainName || "",
    domainRegistrar: domain?.registrar || "",
    domainExpiryDate: toDateInputValue(domain?.expiryDate),
    hostingProvider: domain?.hostingProvider || "",
    paymentTotalAmount: String(payment?.totalAmount ?? ""),
    paidAmount: String(payment?.paidAmount ?? ""),
    paymentType: payment?.paymentType || "",
    paymentDueDate: toDateInputValue(payment?.dueDate),
    maintenanceType: maintenance?.serviceType || "No Maintenance",
    maintenanceRenewalDate: toDateInputValue(maintenance?.renewalDate),
    domainId: domain?._id ? String(domain._id) : "",
    paymentId: payment?._id ? String(payment._id) : "",
    maintenanceId: maintenance?._id ? String(maintenance._id) : "",
  };
}

export default function ProjectsPage() {
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/clients?lite=1")
      .then((r) => r.json())
      .then((data) => {
        const list = data.items || (Array.isArray(data) ? data : []);
        setClients(list.map((c: { _id: string; name: string }) => ({ value: c._id, label: c.name })));
      })
      .catch(() => {});
  }, []);

  return (
    <ModuleCrudPage<Project>
      title={mod.title}
      subtitle="Project allocation and workflow"
      apiPath={mod.api}
      breadcrumbs={moduleBreadcrumbs(mod.route)}
      getRowId={(r) => r._id}
      hiddenFieldKeys={["domainId", "paymentId", "maintenanceId"]}
      fetchEditForm={loadProjectForm}
      statusOptions={[{ value: "All", label: "All" }, ...PROJECT_STATUSES.map((s) => ({ value: s, label: s }))]}
      fields={[
        { key: "name", label: "Project Name", required: true },
        { key: "clientId", label: "Customer", type: "select", options: clients, required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "budget", label: "Budget", type: "number" },
        { key: "status", label: "Status", type: "select", options: PROJECT_STATUSES.map((s) => ({ value: s, label: s })) },
        { key: "domainName", label: "Domain Name" },
        { key: "domainRegistrar", label: "Domain Registrar" },
        { key: "domainExpiryDate", label: "Domain Expiry", type: "date" },
        { key: "hostingProvider", label: "Hosting Provider" },
        { key: "paymentTotalAmount", label: "Total Payment Amount", type: "number" },
        { key: "paidAmount", label: "Paid Amount", type: "number" },
        { key: "paymentType", label: "Payment Type", type: "select", options: PAYMENT_TYPES.map((t) => ({ value: t, label: t })) },
        { key: "paymentDueDate", label: "Payment Due Date", type: "date" },
        {
          key: "maintenanceType",
          label: "Maintenance",
          type: "select",
          options: [{ value: "No Maintenance", label: "No Maintenance" }, ...SERVICE_TYPES.map((t) => ({ value: t, label: t }))],
        },
        { key: "maintenanceRenewalDate", label: "Maintenance Renewal", type: "date" },
      ]}
      columns={[
        { key: "name", label: "Project" },
        { key: "budget", label: "Budget", render: (r) => `₹${(r.budget || 0).toLocaleString()}` },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      extraActions={(row) => (
        <Link
          href={`/projects/${row._id}`}
          className="rounded-xl border border-cyan-300 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
        >
          Open
        </Link>
      )}
    />
  );
}

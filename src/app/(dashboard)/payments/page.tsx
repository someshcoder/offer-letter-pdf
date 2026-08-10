"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import { fetchJsonCached } from "@/lib/clientDataCache";
import { loadCustomerProject } from "@/lib/modules/customerProject";
import { FinanceFlowGuide } from "@/components/modules/FinanceFlowGuide";
import { ModuleCrudPage, StatusBadge } from "@/components/modules/ModuleCrudPage";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";
import { PAYMENT_STATUSES, PAYMENT_TYPES } from "@/types/modules/constants";

const mod = MODULE_REGISTRY.payments;

type Payment = {
  _id: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  invoiceNumber?: string;
  paymentType: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  gstPercent?: number;
  discount?: number;
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const isSalesUser = user?.role === "Employee" || user?.role === "TL";
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetchJsonCached<{ items?: Array<{ _id: string; name: string }> }>("/api/clients?lite=1")
      .then((data) => {
        setClients((data.items || []).map((c) => ({ value: c._id, label: c.name })));
      })
      .catch(() => {});
  }, []);

  return (
    <ModuleCrudPage<Payment>
      title={mod.title}
      subtitle={
        isSalesUser
          ? "Record and track payments for your assigned customers only"
          : "Record how much to collect from the customer and how much has been received"
      }
      apiPath={mod.api}
      breadcrumbs={moduleBreadcrumbs(mod.route)}
      getRowId={(r) => r._id}
      headerExtra={isSalesUser ? undefined : <FinanceFlowGuide page="payments" />}
      hiddenFieldKeys={["projectId"]}
      fetchEditForm={async (row) => {
        let projectName = row.projectName || "";
        if (!projectName && row.projectId) {
          try {
            const res = await fetch(`/api/projects/${row.projectId}`, { cache: "no-store" });
            if (res.ok) {
              const data = await res.json();
              projectName = data.item?.name || "";
            }
          } catch {
            // project name optional for sales users
          }
        }
        return {
          clientId: String(row.clientId || ""),
          projectId: String(row.projectId || ""),
          projectName,
          invoiceNumber: row.invoiceNumber || "",
          paymentType: row.paymentType || "One Time",
          totalAmount: String(row.totalAmount ?? ""),
          paidAmount: String(row.paidAmount ?? ""),
          gstPercent: String(row.gstPercent ?? 18),
          discount: String(row.discount ?? ""),
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
              // Project is optional for sales — customer may not have one yet
              setForm((prev) => ({ ...prev, projectId: "", projectName: isSalesUser ? "No project linked yet" : "" }));
              if (!isSalesUser) {
                toast.error("No project found for this customer — create one in Projects first");
              }
              return;
            }
            setForm((prev) => ({
              ...prev,
              projectId: project._id,
              projectName: project.name,
            }));
          })
          .catch(() => {
            if (!isSalesUser) toast.error("Could not load project");
            setForm((prev) => ({ ...prev, projectId: "", projectName: "" }));
          });
      }}
      transformPayload={(payload) => {
        const { projectName, projectId, ...rest } = payload;
        if (projectId && projectName !== "No project linked yet") {
          return { ...rest, projectId };
        }
        return rest;
      }}
      statusOptions={[{ value: "All", label: "All" }, ...PAYMENT_STATUSES.map((s) => ({ value: s, label: s }))]}
      fields={[
        {
          key: "clientId",
          label: isSalesUser ? "Your Customer" : "Customer (to collect from)",
          type: "select",
          options: clients,
          required: true,
        },
        { key: "projectName", label: "Project (auto)", readOnly: true },
        { key: "paymentType", label: "Payment Type", type: "select", options: PAYMENT_TYPES.map((t) => ({ value: t, label: t })) },
        { key: "totalAmount", label: "Total Amount (₹)", type: "number", required: true },
        { key: "paidAmount", label: "Already Received (₹)", type: "number" },
        { key: "invoiceNumber", label: "Invoice / Bill No." },
        { key: "gstPercent", label: "GST %", type: "number" },
        { key: "discount", label: "Discount (₹)", type: "number" },
      ]}
      columns={[
        { key: "clientName", label: "Customer", render: (r) => r.clientName || "—" },
        { key: "projectName", label: "Project", render: (r) => r.projectName || "—" },
        { key: "totalAmount", label: "Total", render: (r) => `₹${r.totalAmount.toLocaleString()}` },
        { key: "paidAmount", label: "Received", render: (r) => `₹${r.paidAmount.toLocaleString()}` },
        { key: "dueAmount", label: "Due", render: (r) => `₹${r.dueAmount.toLocaleString()}` },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      extraActions={(row, reload) => (
        <>
          {row.dueAmount > 0 && (
            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              onClick={async () => {
                const amount = window.prompt(
                  `How much did ${row.clientName || "Customer"} pay? (Due: ₹${row.dueAmount})`,
                  String(row.dueAmount),
                );
                if (!amount) return;
                const value = Number(amount);
                if (!Number.isFinite(value) || value <= 0) {
                  toast.error("Enter a valid amount");
                  return;
                }
                const res = await fetch(`/api/payments?id=${row._id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    amount: value,
                    paymentMode: "Bank Transfer",
                    notes: isSalesUser ? "Received by sales" : "Recorded from customer payments",
                  }),
                });
                const data = await res.json();
                if (!res.ok) {
                  toast.error(data.error || "Payment record failed");
                  return;
                }
                toast.success("Payment received saved");
                reload();
              }}
            >
              Receive Payment
            </button>
          )}
          {!isSalesUser && (
            <Link
              href="/payment-ledger"
              className="rounded-xl border border-cyan-300 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-300"
            >
              Summary
            </Link>
          )}
        </>
      )}
    />
  );
}

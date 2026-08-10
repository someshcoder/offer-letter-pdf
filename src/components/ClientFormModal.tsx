"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { IClient, ClientStatus } from "@/types/client";
import {
  FormActions,
  FormField,
  FormModal,
  formInput,
  formSelect,
  formTextarea,
} from "@/components/ui/FormUi";

type FormState = {
  name: string;
  mobileNumber: string;
  email: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  status: ClientStatus;
  customerNotes: string;
  assignedStaffKey: string;
  assignedStaffId: string;
  assignedStaffName: string;
};

const emptyForm: FormState = {
  name: "",
  mobileNumber: "",
  email: "",
  companyName: "",
  address: "",
  city: "",
  state: "",
  status: "Pending",
  customerNotes: "",
  assignedStaffKey: "",
  assignedStaffId: "",
  assignedStaffName: "",
};

type EmployeeOption = { _id: string; employeeName: string; mobileNumber?: string };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: IClient | null;
  onSaved: (client: IClient) => void;
}

function staffKey(emp: EmployeeOption) {
  return `${emp.employeeName}|${emp.mobileNumber || ""}`;
}

export function ClientFormModal({ isOpen, onClose, client, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/employees?lite=1&limit=200")
      .then((r) => r.json())
      .then((data) => setEmployees(data.items || []))
      .catch(() => setEmployees([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (client) {
      const companyName = client.domainDetails?.businessName || "";
      setForm({
        name: client.name || "",
        mobileNumber: client.mobileNumber || "",
        email: client.email || "",
        companyName,
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        status: client.status || "Pending",
        customerNotes: client.customerNotes || "",
        assignedStaffKey: "",
        assignedStaffId: client.assignedStaffId || "",
        assignedStaffName: client.assignedStaffName || "",
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [client, isOpen]);

  useEffect(() => {
    if (!isOpen || !client || employees.length === 0) return;
    const emp =
      employees.find((e) => e._id === client.assignedStaffId) ??
      employees.find((e) => e.employeeName === client.assignedStaffName);
    if (emp) {
      setForm((prev) => ({
        ...prev,
        assignedStaffKey: staffKey(emp),
        assignedStaffId: emp._id,
        assignedStaffName: emp.employeeName,
      }));
    }
  }, [client, isOpen, employees]);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectStaff = (key: string) => {
    if (!key) {
      setForm((prev) => ({
        ...prev,
        assignedStaffKey: "",
        assignedStaffId: "",
        assignedStaffName: "",
      }));
      return;
    }
    const emp = employees.find((e) => staffKey(e) === key);
    setForm((prev) => ({
      ...prev,
      assignedStaffKey: key,
      assignedStaffId: emp?._id || "",
      assignedStaffName: emp?.employeeName || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      mobileNumber: form.mobileNumber.trim(),
      email: form.email.trim(),
      companyName: form.companyName.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      status: form.status,
      customerNotes: form.customerNotes.trim(),
      assignedStaffId: form.assignedStaffId || "",
      assignedStaffName: form.assignedStaffName || "",
    };

    try {
      const url = client ? `/api/clients/${client._id}` : "/api/clients";
      const res = await fetch(url, {
        method: client ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(client ? "Customer updated" : "Customer added");
      onSaved(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      title={client ? "Edit Customer" : "Add Customer"}
      subtitle="Basic contact & business details. Domain and hosting are managed in the Domains module."
      size="lg"
      footer={
        <FormActions
          onCancel={onClose}
          onSubmit={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
          loading={loading}
          submitLabel={client ? "Update" : "Save"}
        />
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Customer Name" required>
          <input className={formInput} value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </FormField>
        <FormField label="Company / Business Name">
          <input className={formInput} value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
        </FormField>
        <FormField label="Mobile" required>
          <input className={formInput} value={form.mobileNumber} onChange={(e) => update("mobileNumber", e.target.value)} required />
        </FormField>
        <FormField label="Email">
          <input type="email" className={formInput} value={form.email} onChange={(e) => update("email", e.target.value)} />
        </FormField>
        <FormField label="City">
          <input className={formInput} value={form.city} onChange={(e) => update("city", e.target.value)} />
        </FormField>
        <FormField label="State">
          <input className={formInput} value={form.state} onChange={(e) => update("state", e.target.value)} />
        </FormField>
        <FormField label="Address" className="sm:col-span-2">
          <input className={formInput} value={form.address} onChange={(e) => update("address", e.target.value)} />
        </FormField>
        <FormField label="Status">
          <select className={formSelect} value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Work in Progress">Work in Progress</option>
            <option value="Completed (Live)">Completed (Live)</option>
            <option value="Expired / Not Working">Expired / Not Working</option>
          </select>
        </FormField>
        <FormField label="Assigned Staff" hint="Which staff member will manage this customer">
          <select
            className={formSelect}
            value={form.assignedStaffKey}
            onChange={(e) => selectStaff(e.target.value)}
          >
            <option value="">Not Assigned</option>
            {employees.map((emp) => (
              <option key={emp._id} value={staffKey(emp)}>
                {emp.employeeName}
              </option>
            ))}
          </select>
          {form.assignedStaffName ? (
            <p className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
              Will be assigned under {form.assignedStaffName}
            </p>
          ) : null}
        </FormField>
        <FormField label="Notes" className="sm:col-span-2">
          <textarea
            className={formTextarea}
            rows={3}
            value={form.customerNotes}
            onChange={(e) => update("customerNotes", e.target.value)}
            placeholder="Follow-up, requirements, payment notes..."
          />
        </FormField>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        For domain and hosting records, use the{" "}
        <Link href="/domains" className="font-semibold text-cyan-600 hover:underline">
          Domains
        </Link>{" "}
        or{" "}
        <Link href="/projects" className="font-semibold text-cyan-600 hover:underline">
          Projects
        </Link>{" "}
        module.
      </p>
    </FormModal>
  );
}

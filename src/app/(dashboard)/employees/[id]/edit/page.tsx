"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EmployeeForm } from "@/components/EmployeeForm";
import type { Employee } from "@/types/employee";
import type { EmployeeFormValues } from "@/lib/employeeSchema";
import { PageSkeleton } from "@/components/SkeletonLoader";
import toast from "react-hot-toast";

type EmployeeDetailResponse = { item?: Employee; error?: string };

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/employees/${params.id}`, { cache: "no-store" });
        const data = (await res.json()) as EmployeeDetailResponse;
        if (!res.ok || !data.item) {
          throw new Error(data.error || "Employee not found");
        }
        setItem(data.item);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load employee");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      load();
    }
  }, [params.id]);

  async function onSubmit(payload: { values: EmployeeFormValues; files: FormData }) {
    setSaving(true);

    try {
      const res = await fetch(`/api/employees/${params.id}`, {
        method: "PUT",
        body: payload.files,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Failed to update employee");
        return;
      }

      toast.success("Updated Successfully");
      router.push("/employees");
      router.refresh();
    } catch {
      toast.error("Failed to update employee");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  if (!item) {
    return <p className="p-6 text-sm text-red-700 dark:text-red-300">Employee not found</p>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
            Employee Management
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Edit Employee</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Update employee profile, permissions, and document details.
          </p>
        </header>
        <EmployeeForm mode="edit" initial={item} loading={saving} onSubmit={onSubmit} />
      </div>
    </div>
  );
}

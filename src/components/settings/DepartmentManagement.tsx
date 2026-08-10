"use client";

import { useState, useEffect } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { 
  Plus, Trash2, Edit2, GripVertical, Check, X, 
  Briefcase, MapPin, Layers, Loader2, Save
} from "lucide-react";
import toast from "react-hot-toast";
import { FormSkeleton } from "@/components/SkeletonLoader";

const COMMON_DEPARTMENTS = [
  "Information Technology (IT)",
  "Human Resources (HR)",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "Customer Support",
  "Research & Development",
  "Legal",
  "Administration",
  "Quality Assurance (QA)",
  "Logistics & Supply Chain",
  "Product Management",
  "Design & Creative",
  "Public Relations (PR)",
  "Content & Strategy",
  "Facilities & Security",
  "Accounting & Audit"
];

interface Department {
  _id: string;
  name: string;
  roles: string[];
  order: number;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    roles: ""
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/settings/departments");
      const data = await res.json();
      setDepartments(data);
    } catch (error) {
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error("Department name is required");
      return;
    }

    try {
      const res = await fetch("/api/settings/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          roles: formData.roles.split(",").map(r => r.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        toast.success("Department added");
        setFormData({ name: "", roles: "" });
        setIsAdding(false);
        fetchDepartments();
      }
    } catch (error) {
      toast.error("Failed to add department");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          roles: formData.roles.split(",").map(r => r.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        toast.success("Department updated");
        setEditingId(null);
        setFormData({ name: "", roles: "" });
        fetchDepartments();
      }
    } catch (error) {
      toast.error("Failed to update department");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      const res = await fetch(`/api/settings/departments/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Department deleted");
        fetchDepartments();
      }
    } catch (error) {
      toast.error("Failed to delete department");
    }
  };

  const handleReorder = async (newOrder: Department[]) => {
    setDepartments(newOrder);
    try {
      await fetch("/api/settings/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: newOrder.map((dept, index) => ({ _id: dept._id, order: index }))
        })
      });
    } catch (error) {
      toast.error("Failed to save order");
    }
  };

  const startEditing = (dept: Department) => {
    setEditingId(dept._id);
    setFormData({
      name: dept.name,
      roles: dept.roles.join(", ")
    });
  };

  if (loading) {
    return <FormSkeleton rows={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Department Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and organize your company departments.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-cyan-700 active:scale-95"
        >
          <Plus className="size-4" />
          Add Department
        </button>
      </div>

      {isAdding && (
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/30 p-4 dark:border-cyan-900/30 dark:bg-cyan-950/10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-cyan-700 dark:text-cyan-400">Dept Name</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Engineering"
                list="dept-suggestions"
                className="w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none dark:border-cyan-800 dark:bg-slate-900"
              />
              <datalist id="dept-suggestions">
                {COMMON_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-cyan-700 dark:text-cyan-400">Roles (comma separated)</label>
              <input
                value={formData.roles}
                onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                placeholder="Developer, Lead, Manager"
                className="w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none dark:border-cyan-800 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="rounded-lg bg-cyan-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              Create Department
            </button>
          </div>
        </div>
      )}

      <Reorder.Group axis="y" values={departments} onReorder={handleReorder} className="space-y-3">
        {departments.map((dept) => (
          <Reorder.Item
            key={dept._id}
            value={dept}
            className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-cyan-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-900/50"
          >
            {editingId === dept._id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    list="dept-suggestions"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    value={formData.roles}
                    onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="size-5" />
                  </button>
                  <button onClick={() => handleUpdate(dept._id)} className="p-2 text-cyan-600 hover:text-cyan-700">
                    <Check className="size-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-cyan-500 transition-colors">
                  <GripVertical className="size-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{dept.name}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(dept)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept._id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Briefcase className="size-4 text-cyan-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Roles:</span>
                      {dept.roles.length > 0 ? dept.roles.join(", ") : "None defined"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Reorder.Item>
        ))}
        {departments.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-12 dark:border-slate-800">
            <Layers className="mb-4 size-12 text-slate-300" />
            <p className="text-slate-500">No departments added yet.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 text-sm font-semibold text-cyan-600 hover:underline"
            >
              Create your first department
            </button>
          </div>
        )}
      </Reorder.Group>
    </div>
  );
}

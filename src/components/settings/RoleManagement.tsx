"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Edit2, ChevronRight, ChevronLeft, 
  Layers, Briefcase, Loader2, Save, X, Check
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FormSkeleton } from "@/components/SkeletonLoader";

const COMMON_ROLES = [
  "Software Developer",
  "MERN Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "UI/UX Designer",
  "Graphic Designer",
  "Project Manager",
  "Product Manager",
  "Team Leader",
  "Quality Analyst",
  "Automation Engineer",
  "HR Executive",
  "HR Manager",
  "Sales Manager",
  "Business Development Executive",
  "Marketing Analyst",
  "SEO Specialist",
  "Content Writer",
  "Social Media Manager",
  "Accountant",
  "Finance Executive",
  "Operation Executive",
  "Customer Support Engineer",
  "System Administrator",
  "Office Assistant",
  "Intern"
];

interface Department {
  _id: string;
  name: string;
  roles: string[];
}

export default function RoleManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [newRole, setNewRole] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/settings/departments");
      const data = await res.json();
      setDepartments(data);
      // Update selected dept if it's currently open
      if (selectedDept) {
        const updated = data.find((d: any) => d._id === selectedDept._id);
        if (updated) setSelectedDept(updated);
      }
    } catch (error) {
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedDept || !newRole.trim()) return;

    const updatedRoles = [...selectedDept.roles, newRole.trim()];
    await updateDepartmentRoles(selectedDept._id, updatedRoles);
    setNewRole("");
  };

  const handleDeleteRole = async (index: number) => {
    if (!selectedDept || !confirm("Delete this role?")) return;

    const updatedRoles = selectedDept.roles.filter((_, i) => i !== index);
    await updateDepartmentRoles(selectedDept._id, updatedRoles);
  };

  const startEditing = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const handleUpdateRole = async () => {
    if (!selectedDept || editingIndex === null || !editingValue.trim()) return;

    const updatedRoles = [...selectedDept.roles];
    updatedRoles[editingIndex] = editingValue.trim();
    await updateDepartmentRoles(selectedDept._id, updatedRoles);
    setEditingIndex(null);
  };

  const updateDepartmentRoles = async (id: string, roles: string[]) => {
    try {
      const res = await fetch(`/api/settings/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles })
      });

      if (res.ok) {
        toast.success("Roles updated");
        fetchDepartments();
      } else {
        toast.error("Failed to update roles");
      }
    } catch (error) {
      toast.error("Error updating roles");
    }
  };

  if (loading) {
    return <FormSkeleton rows={3} />;
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedDept ? (
          <motion.div
            key="dept-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Department</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Choose a department to manage its specific roles.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {departments.map((dept) => (
                <button
                  key={dept._id}
                  onClick={() => setSelectedDept(dept)}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-cyan-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 dark:bg-slate-800 dark:group-hover:bg-cyan-950/30">
                      <Layers className="size-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-white">{dept.name}</p>
                      <p className="text-xs text-slate-500">{dept.roles.length} roles defined</p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-slate-300 group-hover:text-cyan-500" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="role-editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedDept(null)}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <ChevronLeft className="size-4" />
                Back to Departments
              </button>
            </div>

            <div className="flex items-center gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                <Briefcase className="size-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedDept.name} Roles</h2>
                <p className="text-sm text-slate-500">Manage designations for this department.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Add new role (e.g. Senior Executive)"
                list="role-suggestions"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900"
                onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
              />
              <datalist id="role-suggestions">
                {COMMON_ROLES.map(role => (
                  <option key={role} value={role} />
                ))}
              </datalist>
              <button
                onClick={handleAddRole}
                className="rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-cyan-700"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {selectedDept.roles.map((role, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/20 dark:hover:bg-slate-900"
                >
                  {editingIndex === index ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        list="role-suggestions"
                        className="flex-1 rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-sm text-slate-900 dark:text-white outline-none dark:border-cyan-800 dark:bg-slate-900"
                      />
                      <button onClick={handleUpdateRole} className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg">
                        <Check className="size-4" />
                      </button>
                      <button onClick={() => setEditingIndex(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="size-1.5 rounded-full bg-cyan-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{role}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(index, role)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(index)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {selectedDept.roles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Briefcase className="mb-2 size-8 text-slate-200" />
                  <p className="text-sm text-slate-400">No roles added yet for this department.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Layers, ChevronRight, Shield, Map } from "lucide-react";
import { ModuleGuide } from "@/components/ModuleGuide";

const CompanySettingsForm = dynamic(
  () => import("@/components/settings/CompanySettingsForm"),
);
const DepartmentManagement = dynamic(
  () => import("@/components/settings/DepartmentManagement"),
);
const RoleManagement = dynamic(() => import("@/components/settings/RoleManagement"));

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"company" | "departments" | "roles" | "guide">("company");

  const tabs = useMemo(
    () => [
      { id: "company", label: "Company Profile", icon: Building2 },
      { id: "departments", label: "Departments", icon: Layers },
      { id: "roles", label: "Roles", icon: Shield },
      { id: "guide", label: "Module Guide", icon: Map },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 dark:bg-slate-950/50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Manage your company details and organizational structure.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white text-cyan-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-cyan-400 dark:ring-slate-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`size-5 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"}`} />
                      {tab.label}
                    </div>
                    {isActive && (
                      <motion.div layoutId="active-tab-indicator">
                        <ChevronRight className="size-4" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <AnimatePresence mode="wait">
                {activeTab === "company" && (
                  <motion.div
                    key="company"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CompanySettingsForm />
                  </motion.div>
                )}
                {activeTab === "departments" && (
                  <motion.div
                    key="departments"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DepartmentManagement />
                  </motion.div>
                )}
                {activeTab === "roles" && (
                  <motion.div
                    key="roles"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RoleManagement />
                  </motion.div>
                )}
                {activeTab === "guide" && (
                  <motion.div
                    key="guide"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ModuleGuide />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

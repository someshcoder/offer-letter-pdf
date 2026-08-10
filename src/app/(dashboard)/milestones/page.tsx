"use client";

import { useEffect, useState } from "react";
import { ModuleCrudPage, StatusBadge } from "@/components/modules/ModuleCrudPage";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";
import { MILESTONE_STATUSES } from "@/types/modules/constants";

const mod = MODULE_REGISTRY.milestones;

type Milestone = { _id: string; title: string; projectId: string; deadline: string; progress: number; status: string };

export default function MilestonesPage() {
  const [projects, setProjects] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    fetch("/api/projects?limit=100").then((r) => r.json()).then((d) => {
      setProjects((d.items || []).map((p: { _id: string; name: string }) => ({ value: p._id, label: p.name })));
    });
  }, []);

  return (
    <ModuleCrudPage<Milestone>
      title={mod.title}
      subtitle="Track deadlines and progress"
      apiPath={mod.api}
      breadcrumbs={moduleBreadcrumbs(mod.route)}
      getRowId={(r) => r._id}
      statusOptions={[{ value: "All", label: "All" }, ...MILESTONE_STATUSES.map((s) => ({ value: s, label: s }))]}
      fields={[
        { key: "projectId", label: "Project", type: "select", options: projects, required: true },
        { key: "title", label: "Title", required: true },
        { key: "deadline", label: "Deadline", type: "date", required: true },
        { key: "progress", label: "Progress %", type: "number" },
        { key: "status", label: "Status", type: "select", options: MILESTONE_STATUSES.map((s) => ({ value: s, label: s })) },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      columns={[
        { key: "title", label: "Milestone" },
        { key: "deadline", label: "Deadline", render: (r) => new Date(r.deadline).toLocaleDateString() },
        { key: "progress", label: "Progress", render: (r) => (
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-2 rounded-full bg-cyan-500" style={{ width: `${r.progress}%` }} /></div>
            <span>{r.progress}%</span>
          </div>
        )},
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}

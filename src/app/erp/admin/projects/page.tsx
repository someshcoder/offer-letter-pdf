"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Card, CardSkeleton } from "@/components/erp/ui/Shared";
import { Briefcase, Loader2, IndianRupee, Clock, CheckCircle2, XCircle, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/erp/admin/projects");
      const d = await res.json();
      if (res.ok) setProjects(d.data);
    } catch (e) { toast.error("Failed fetch"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, nextStatus: string, approved: boolean) => {
    try {
      const res = await fetch("/api/erp/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, status: nextStatus, adminApproval: approved })
      });
      if (res.ok) {
        toast.success("Project governance updated.");
        fetchProjects();
      }
    } catch (e) { toast.error("Update fail"); }
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Operational Pipeline" subtitle="Admin oversight across network active project cycles." />
      <div className="bg-white dark:bg-[#0f172a] border dark:border-slate-800 rounded-xl px-4 py-2 max-w-sm mb-6 shadow-sm flex items-center">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input placeholder="Find by project name..." className="bg-transparent border-none outline-none text-sm w-full dark:text-white" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <CardSkeleton count={4} grid="grid-cols-1" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No active proposals in system.</div>
      ) : (
        <div className="grid gap-6">
          {filtered.map((proj) => (
            <Card key={proj._id} className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <Briefcase className="text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg dark:text-white">{proj.name}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${proj.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{proj.status}</span>
                  </div>
                  <p className="text-slate-500 text-xs">Franchise: <span className="text-slate-900 dark:text-slate-200 font-bold">{proj.franchiseId?.businessName || "Unknown"}</span></p>
                  <p className="text-slate-500 text-xs">Client: {proj.clientId?.name}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-slate-400 text-xs uppercase font-bold">Allocated</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center justify-end"><IndianRupee size={16}/> {proj.budget.toLocaleString()}</p>
              </div>
              <div className="flex gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                {proj.status === "Pending" ? (
                  <>
                    <button onClick={() => updateStatus(proj._id, "Approved", true)} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-colors">
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button className="flex-1 md:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                ) : (
                  <div className="text-emerald-600 font-semibold text-sm flex items-center gap-1"><CheckCircle2 size={16}/> Confirmed Pipeline</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

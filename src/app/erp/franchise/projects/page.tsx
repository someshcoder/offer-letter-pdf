"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Card, CardSkeleton, Modal, Badge } from "@/components/erp/ui/Shared";
import { Plus, Briefcase, Loader2, IndianRupee, Activity, FilePlus, Receipt, Landmark } from "lucide-react";
import toast from "react-hot-toast";
import type { ProjectFinancialSnapshot } from "@/lib/erp/projectFinancials";

type ProjectRow = {
  _id: string;
  name: string;
  description?: string;
  budget: number;
  status: string;
  currentProgress: number;
  clientId?: { name?: string };
  financials?: ProjectFinancialSnapshot | null;
};

function formatInr(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function FranchiseProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPropOpen, setIsPropOpen] = useState(false);
  const [isInvOpen, setIsInvOpen] = useState(false);
  const [isProgOpen, setIsProgOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeProject, setActiveProject] = useState<ProjectRow | null>(null);
  const [invForm, setInvForm] = useState({ amount: "", tax: "0" });
  const [propForm, setPropForm] = useState({ clientId: "", name: "", description: "", budget: "" });
  const [progForm, setProgForm] = useState("0");

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pr, cl] = await Promise.all([fetch("/api/erp/franchise/projects"), fetch("/api/erp/franchise/clients")]);
      const [pd, cd] = await Promise.all([pr.json(), cl.json()]);
      if (pr.ok) setProjects(Array.isArray(pd.data) ? pd.data : []);
      if (cl.ok) setClients(cd.data);
    } catch (e) { toast.error("Link fail"); }
    finally { setLoading(false); }
  };

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/erp/franchise/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...propForm, budget: parseFloat(propForm.budget) }),
      });
      if (r.ok) { toast.success("Proposal dispatched."); setIsPropOpen(false); fetchInitialData(); }
    } catch (e) { toast.error("Sub fail"); }
    finally { setSaving(false); }
  };

  const updateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!activeProject) return;
      const r = await fetch(`/api/erp/franchise/projects/${activeProject._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProgress: parseInt(progForm, 10) }),
      });
      if (r.ok) { toast.success("Progress locked."); setIsProgOpen(false); fetchInitialData(); }
    } catch (e) { toast.error("Update error"); }
    finally { setSaving(false); }
  };

  const submitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = activeProject?._id != null ? String(activeProject._id) : "";
    if (!pid) {
      toast.error("No project selected.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/erp/franchise/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: pid, ...invForm }),
      });
      if (r.ok) { toast.success("Bill locked - Pending Admin Approval."); setIsInvOpen(false); }
      else {
        let msg = `Error ${r.status}`;
        const text = await r.text();
        try {
          const d = JSON.parse(text) as { error?: string };
          if (d?.error) msg = d.error;
        } catch {
          if (text) msg = text.slice(0, 200);
        }
        toast.error(msg);
      }
    } catch (e) { toast.error("Sync fail"); }
    finally { setSaving(false); }
  };

  const getBadgeType = (s: string): any => {
    if (s === "Approved") return "info";
    if (s === "In Progress") return "warning";
    if (s === "Completed") return "success";
    return "neutral";
  };

  return (
    <div>
      <PageHeader title="Project Portfolio" subtitle="Update workflow metrics and transmit secure revenue lock requests." action={
        <button onClick={() => setIsPropOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg"><Plus size={16}/> Propose Project</button>
      }/>

      {loading ? <CardSkeleton count={4} grid="grid-cols-1 lg:grid-cols-2" /> : projects.length === 0 ? (
        <Card className="p-16 text-center border-dashed flex flex-col items-center"><Briefcase className="w-16 h-16 opacity-20 mb-4"/><h3 className="font-black dark:text-white">Empty Pipeline</h3></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((p) => (
            <Card key={p._id} className="p-6 flex flex-col border-l-4 border-l-indigo-500">
              <div className="flex justify-between items-start mb-2">
                <div><h3 className="font-black text-slate-900 dark:text-white text-lg">{p.name}</h3><p className="text-xs font-bold uppercase text-slate-400">{p.clientId?.name}</p></div>
                <Badge label={p.status} type={getBadgeType(p.status)} />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 flex-1 line-clamp-2">{p.description || "---"}</p>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border dark:border-slate-800">
                {p.financials ? (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 space-y-2.5 min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Landmark size={12}/> Payment ledger</p>
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">Approved deal</span>
                        <span className="font-black text-slate-900 dark:text-white tabular-nums flex items-center gap-0.5"><IndianRupee size={14} className="shrink-0 opacity-70"/>{formatInr(p.financials.grossBudget)}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-sm text-amber-700 dark:text-amber-400/90">
                        <span className="font-semibold">Platform commission ({p.financials.commissionPct}%)</span>
                        <span className="font-black tabular-nums">− <IndianRupee size={14} className="inline shrink-0 opacity-70"/>{formatInr(p.financials.commissionAmount)}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Receipt size={12}/> Invoiced (excl. draft)</span>
                        <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300"><IndianRupee size={12} className="inline shrink-0"/>{formatInr(p.financials.invoicedTotal)}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Verified received</span>
                        <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400"><IndianRupee size={12} className="inline shrink-0"/>{formatInr(p.financials.verifiedPaidTotal)}</span>
                      </div>
                      <div className="flex justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
                        <span className="font-black text-slate-800 dark:text-slate-200">Balance due (client)</span>
                        <span className={`font-black tabular-nums flex items-center gap-0.5 ${p.financials.outstandingFromClient <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                          <IndianRupee size={16} className="shrink-0 opacity-80"/>{formatInr(p.financials.outstandingFromClient)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 cursor-pointer group sm:pt-6" onClick={() => { setActiveProject(p); setProgForm(String(p.currentProgress)); setIsProgOpen(true); }}>
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1 group-hover:text-indigo-500 transition-colors">Stage ({p.currentProgress}%) ✎</div>
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 ml-auto"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${p.currentProgress}%` }} /></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Committed</div><div className="font-black text-lg flex items-center dark:text-white"><IndianRupee size={16}/>{p.budget.toLocaleString("en-IN")}</div></div>
                    <div className="text-right cursor-pointer group" onClick={() => { setActiveProject(p); setProgForm(String(p.currentProgress)); setIsProgOpen(true); }}>
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1 group-hover:text-indigo-500 transition-colors">Stage ({p.currentProgress}%) ✎</div>
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${p.currentProgress}%` }} /></div>
                    </div>
                  </div>
                )}
              </div>

              {(p.status === "Approved" || p.status === "In Progress") && (
                <div className="mt-4 pt-4 border-t dark:border-slate-800 flex gap-3 justify-end">
                  <button onClick={() => { setActiveProject(p); setProgForm(String(p.currentProgress)); setIsProgOpen(true); }} className="flex items-center gap-1.5 text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl transition-all"><Activity size={14}/> Update %</button>
                  <button onClick={() => { setActiveProject(p); setIsInvOpen(true); }} className="flex items-center gap-1.5 text-xs font-black bg-indigo-600 text-white px-4 py-2 rounded-xl hover:opacity-90 shadow-lg shadow-indigo-900/20 transition-all"><FilePlus size={14}/> Create Bill</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isPropOpen} onClose={() => setIsPropOpen(false)} title="Launch Workstream">
        <form onSubmit={submitProposal} className="space-y-4">
          <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Target User</label><select required className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-3 font-medium dark:text-white" value={propForm.clientId} onChange={e => setPropForm({...propForm, clientId: e.target.value})}><option value="">-- Select --</option>{clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Name</label><input required className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-3 dark:text-white" value={propForm.name} onChange={e => setPropForm({...propForm, name: e.target.value})}/></div>
          <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Allocated Budget</label><input type="number" required className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-3 font-black dark:text-white" value={propForm.budget} onChange={e => setPropForm({...propForm, budget: e.target.value})}/></div>
          <button disabled={saving} className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2">{saving ? <Loader2 className="animate-spin"/> : "Deploy Proposal"}</button>
        </form>
      </Modal>

      <Modal isOpen={isProgOpen} onClose={() => setIsProgOpen(false)} title="Adjust Completion Status">
        <form onSubmit={updateProgress} className="space-y-5 text-center">
          <div className="text-5xl font-black text-indigo-600 tracking-tighter">{progForm}%</div>
          <input type="range" min="0" max="100" value={progForm} onChange={e => setProgForm(e.target.value)} className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-full appearance-none" />
          <div className="flex gap-3">
             <button type="button" onClick={() => setIsProgOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
             <button disabled={saving} className="flex-1 py-3 bg-slate-900 text-white dark:bg-white dark:text-black font-black rounded-xl shadow-lg">{saving ? "Locking..." : "Update Now"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isInvOpen} onClose={() => setIsInvOpen(false)} title="Request Bill Creation">
        <form onSubmit={submitInvoice} className="space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl text-xs font-bold text-indigo-600 mb-2 border border-indigo-100 dark:border-indigo-900/30">⚠️ Submitting this requires manual Admin authorization.</div>
          <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Base Total (INR)</label><input type="number" required className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-3 font-black dark:text-white" value={invForm.amount} onChange={e => setInvForm({...invForm, amount: e.target.value})}/></div>
          <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Tax / Extra</label><input type="number" className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-3 font-black dark:text-white" value={invForm.tax} onChange={e => setInvForm({...invForm, tax: e.target.value})}/></div>
          <button disabled={saving} className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2">{saving ? <Loader2 className="animate-spin"/> : "Initialize Billing Flow"}</button>
        </form>
      </Modal>
    </div>
  );
}

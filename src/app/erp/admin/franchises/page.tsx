"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Card, TableSkeleton, Modal, Badge } from "@/components/erp/ui/Shared";
import { Plus, Briefcase, Users, IndianRupee, Loader2, Shield, Eye, TrendingUp, Target, ArrowUpRight, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminFranchisesPage() {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Detailed Inspector State
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [fetchingStats, setFetchingStats] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "", ownerName: "", email: "", phone: "", location: "", password: "", commissionPercentage: "10"
  });

  useEffect(() => { fetchInitial(); }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/erp/admin/franchises");
      const data = await res.json();
      if (res.ok) setFranchises(data.data);
    } catch (e) { toast.error("Sync error"); }
    finally { setLoading(false); }
  };

  const handleInspect = async (id: string) => {
    setInspectId(id);
    setFetchingStats(true);
    setAnalytics(null);
    try {
      const res = await fetch(`/api/erp/admin/franchises/${id}/analytics`);
      const data = await res.json();
      if (res.ok) setAnalytics(data.data);
      else toast.error("Target inspection fail");
    } catch (e) { toast.error("Logic link broken"); }
    finally { setFetchingStats(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/erp/admin/franchises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, commissionPercentage: parseFloat(formData.commissionPercentage) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action denied");
      
      toast.success("Entity authorized & onboarded.");
      setIsModalOpen(false);
      setFormData({ businessName: "", ownerName: "", email: "", phone: "", location: "", password: "", commissionPercentage: "10" });
      fetchInitial();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Franchise Management" subtitle="Manage all registered franchises and track network performance." action={
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all">
          <Plus size={16} /> Add Franchise
        </button>
      }/>

      {loading ? <TableSkeleton rows={6} /> : franchises.length === 0 ? (
        <Card className="p-16 text-center flex flex-col items-center border-dashed"><Shield className="opacity-10 w-16 h-16 mb-3"/><h3 className="font-black text-slate-300 uppercase text-xs tracking-widest">Static Perimeter</h3></Card>
      ) : (
        <div className="bg-white dark:bg-[#0f172a] border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Business Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Commission</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {franchises.map((f) => (
                  <tr key={f._id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900 dark:text-white text-sm">{f.businessName}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{f.ownerName}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{f.email}</td>
                    <td className="px-6 py-4"><Badge label={`${f.commissionPercentage || 0}% cut`} type="info" /></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleInspect(f._id)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 ml-auto hover:opacity-90 transition-all">
                        <Eye size={12}/> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deep Entity Performance Inspector Modal */}
      <Modal isOpen={!!inspectId} onClose={() => setInspectId(null)} title="Franchise Performance Details" size="2xl">
        {fetchingStats ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400"><Loader2 className="animate-spin mb-4 w-8 h-8 text-indigo-600"/><p className="text-xs font-bold">Loading Data...</p></div>
        ) : analytics && (
          <div className="animate-in zoom-in-95 fade-in duration-500 space-y-6">
            {/* Top Hero Profile - Now slimmer & full width */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-900 px-8 py-6 text-white border border-slate-800 shadow-xl flex items-center justify-between">
               <div className="absolute right-[-10px] top-[-10px] opacity-10 scale-90"><TrendingUp size={180}/></div>
               
               <div className="relative z-10 flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]"><Shield size={28}/></div>
                  <div>
                     <div className="inline-flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Operating Verified
                     </div>
                     <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">{analytics.franchise.businessName}</h2>
                     <p className="text-slate-400 text-xs font-medium mt-1 flex items-center gap-2"><span className="text-indigo-300 font-bold">{analytics.franchise.ownerName}</span> • <span>{analytics.franchise.location || "Global"}</span></p>
                  </div>
               </div>
               <button onClick={() => setInspectId(null)} className="relative z-10 h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/60 hover:text-white"><Shield size={16}/></button>
            </div>

            {/* Body split into 2 Columns to save Height */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
               {/* Left Side: Core Financials (Column span 2) */}
               <div className="lg:col-span-2 space-y-4">
                  <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-[#111a2e] p-5 border dark:border-slate-800 transition-all hover:-translate-y-0.5 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Value</p>
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center tracking-tighter"><IndianRupee className="w-5 h-5 text-emerald-500 mr-0.5"/>{analytics.metrics.grossRevenue.toLocaleString()}</h3>
                  </div>

                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-5 text-white shadow-lg border border-indigo-500/20">
                     <Target size={60} className="absolute right-[-10px] bottom-[-10px] opacity-20" />
                     <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest flex items-center gap-2">Admin Slice <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-lg">{analytics.metrics.commissionPct}%</span></p>
                     <h3 className="text-2xl font-black mt-1 flex items-center tracking-tighter drop-shadow-md"><IndianRupee className="w-5 h-5 text-indigo-200 mr-0.5"/>{analytics.metrics.calculatedCommission.toLocaleString()}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl p-4 border dark:border-slate-800 flex flex-col items-center text-center justify-center py-6">
                        <Briefcase size={20} className="text-indigo-500 mb-2"/>
                        <span className="text-xl font-black dark:text-white leading-none">{analytics.metrics.totalProjects}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase mt-1.5 tracking-wider">Projects</span>
                     </div>
                     <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl p-4 border dark:border-slate-800 flex flex-col items-center text-center justify-center py-6">
                        <Users size={20} className="text-blue-500 mb-2"/>
                        <span className="text-xl font-black dark:text-white leading-none">{analytics.metrics.totalClients}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase mt-1.5 tracking-wider">Clients</span>
                     </div>
                  </div>
               </div>

               {/* Right Side: The List (Column span 3) - Fits parallel to stats */}
               <div className="lg:col-span-3 bg-white dark:bg-[#0f172a] border dark:border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                     <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div> Project Ledger</h4>
                     <Badge label={`${analytics.projects.length} Records`} type="info"/>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto max-h-[260px] space-y-2 custom-scrollbar bg-transparent">
                     {analytics.projects.length === 0 ? (
                        <div className="p-10 text-center text-xs font-bold text-slate-400 italic">Empty dataset.</div>
                     ) : analytics.projects.map((p: any) => (
                        <div key={p._id} className="flex justify-between items-center p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#1e293b] border border-transparent dark:hover:border-slate-800 transition-all group">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Briefcase size={14} /></div>
                              <div>
                                 <p className="font-bold text-slate-900 dark:text-white text-sm leading-none">{p.name}</p>
                                 <p className="text-[10px] text-slate-500 font-medium mt-1.5 flex items-center gap-1"><IndianRupee size={10}/>{p.budget.toLocaleString()}</p>
                              </div>
                           </div>
                           <Badge label={p.status} type={p.status === 'Approved' || p.status === 'Completed' ? 'success' : 'warning'} />
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Dynamic Entity Onboarding Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Franchise">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Business Name</label><input required className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 font-bold dark:text-white" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})}/></div>
             <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Owner Name</label><input required className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 font-medium dark:text-white" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})}/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Email Address</label><input type="email" required className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 font-medium dark:text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/></div>
             <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Password</label><input type="password" required className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 font-bold dark:text-white" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Location</label><input className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 dark:text-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}/></div>
             <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Phone Number</label><input required type="tel" className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 font-medium dark:text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/></div>
          </div>
          <div className="grid grid-cols-1 gap-4">
             <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Commission Percentage (%)</label><input type="number" required className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" value={formData.commissionPercentage} onChange={e => setFormData({...formData, commissionPercentage: e.target.value})}/></div>
          </div>
          <button disabled={saving} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity mt-2 flex justify-center items-center gap-2">{saving ? <Loader2 className="animate-spin"/> : "Save Franchise Account"}</button>
        </form>
      </Modal>
    </div>
  );
}

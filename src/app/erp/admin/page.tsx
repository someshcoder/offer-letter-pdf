import React from "react";
import { PageHeader, StatCard, Card } from "@/components/erp/ui/Shared";
import { Shield, Briefcase, TrendingUp, Activity, Globe, IndianRupee, Clock, Fingerprint } from "lucide-react";
import connectDB from "@/lib/mongodb";
import ErpFranchise from "@/models/erp/ErpFranchise";
import ErpProject from "@/models/erp/ErpProject";
import ErpInvoice from "@/models/erp/ErpInvoice";
import ErpAuditLog from "@/models/erp/ErpAuditLog";
import Link from "next/link";

async function getGlobalQuantumStats() {
  try {
    await connectDB();
    
    const [tF, pP, tP, invs, logs] = await Promise.all([
      ErpFranchise.countDocuments(),
      ErpProject.countDocuments({ status: "Pending" }),
      ErpProject.countDocuments(),
      ErpInvoice.find({ status: { $in: ["Approved", "Paid"] } }).lean().select("total"),
      ErpAuditLog.find({}).sort({ createdAt: -1 }).limit(6).lean()
    ]);

    const revenue = (invs as any[]).reduce((s, i) => s + (i.total || 0), 0);

    return {
      totalFranchises: tF,
      pendingProjects: pP,
      totalProjects: tP,
      globalRevenue: revenue,
      auditFeed: logs
    };
  } catch (e) {
    return { totalFranchises: 0, pendingProjects: 0, totalProjects: 0, globalRevenue: 0, auditFeed: [] };
  }
}

export default async function AdminDashboardPage() {
  const stats = await getGlobalQuantumStats();

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Dashboard" subtitle="Overview of business network performance and global analytics." action={
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 px-4 py-2 rounded-xl font-bold text-xs border border-emerald-100 dark:border-emerald-900/30"><Globe size={14}/> Active System</div>
      } />

      {/* High-Echelon Fiscal Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
           <div className="absolute -right-10 -top-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><TrendingUp size={300} /></div>
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                <Fingerprint size={14} className="text-indigo-400"/> Total Global Revenue
             </div>
             <div className="flex items-baseline gap-1 mb-8">
                <span className="text-slate-500 font-bold text-3xl">₹</span>
                <h2 className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{stats.globalRevenue.toLocaleString()}</h2>
             </div>
             <div className="flex gap-6 border-t border-white/10 pt-6">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Franchises</p><p className="text-xl font-bold">{stats.totalFranchises}</p></div>
                <div className="w-px bg-white/10"/>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Projects</p><p className="text-xl font-bold">{stats.totalProjects}</p></div>
             </div>
           </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
           <StatCard title="Total Franchises" value={stats.totalFranchises} icon="Shield" color="blue" />
           <StatCard title="Pending Approvals" value={stats.pendingProjects} icon="Clock" color="orange" />
           <StatCard title="Total Projects" value={stats.totalProjects} icon="Briefcase" color="indigo" />
           <div className="bg-white dark:bg-[#0f172a] border dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden shadow-sm">
              <Activity size={80} className="absolute -right-4 -bottom-4 text-slate-100 dark:text-slate-900"/>
              <p className="text-[10px] font-bold text-slate-400 uppercase relative z-10">System Health</p>
              <p className="text-xl font-bold dark:text-white mt-1 relative z-10">Running Smooth</p>
           </div>
        </div>
      </div>

      {/* Visual Monitoring Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8 flex flex-col relative overflow-hidden min-h-[350px] border-dashed border-2 border-slate-200 dark:border-slate-800 justify-center items-center text-center bg-slate-50/50 dark:bg-slate-900/20">
           <Globe className="text-slate-200 dark:text-slate-800 mb-4" size={50}/>
           <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">Visual Data Maps</h3>
           <p className="text-slate-500 text-xs max-w-xs leading-relaxed font-medium">Charts and geographic breakdowns will appear here as new transaction data fills the system.</p>
        </Card>

        {/* Master Global Audit Matrix Feed */}
        <div className="bg-slate-900 rounded-[2rem] p-7 text-white flex flex-col shadow-2xl border border-slate-800">
           <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"/>
              <h3 className="font-bold text-sm uppercase tracking-wider">Recent System Activity</h3>
           </div>
           <div className="space-y-6 flex-1">
              {stats.auditFeed.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-slate-600 font-bold text-xs italic">No recent logs.</div>
              ) : stats.auditFeed.map((log: any) => (
                 <div key={log._id} className="relative pl-5 border-l-2 border-slate-800 group hover:border-indigo-500 transition-all">
                    <div className="absolute -left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-slate-800 group-hover:bg-indigo-500 border-2 border-slate-900 transition-all"/>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{log.module}</p>
                    <p className="text-xs font-medium text-slate-200 mt-0.5 leading-snug">{log.details}</p>
                    <p className="text-[9px] text-slate-500 mt-1.5 font-mono">{new Date(log.createdAt).toLocaleTimeString([], {hour12: true, hour: '2-digit', minute:'2-digit'})}</p>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

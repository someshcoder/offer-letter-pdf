import React from "react";
import { PageHeader, StatCard, Card } from "@/components/erp/ui/Shared";
import { Users, Briefcase, FileText, Play, IndianRupee, Activity, Clock, ArrowUpRight } from "lucide-react";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB from "@/lib/mongodb";
import ErpClient from "@/models/erp/ErpClient";
import ErpProject from "@/models/erp/ErpProject";
import ErpInvoice from "@/models/erp/ErpInvoice";
import ErpFranchise from "@/models/erp/ErpFranchise";
import ErpAuditLog from "@/models/erp/ErpAuditLog";
import Link from "next/link";

async function getFranchiseIntelligence(fid: string) {
  try {
    await connectDB();
    const q = { franchiseId: fid };
    
    // Paralellized Aggregated Compute Engine
    const [tc, tp, ap, invoices, fData, logs] = await Promise.all([
      ErpClient.countDocuments(q),
      ErpProject.countDocuments(q),
      ErpProject.countDocuments({ ...q, status: "In Progress" }),
      ErpInvoice.find({ ...q, status: { $in: ["Approved", "Paid"] } }).lean().select("total"),
      ErpFranchise.findById(fid).lean(),
      ErpAuditLog.find({ userId: (await getErpAuth())?.userId }).sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const totalRev = (invoices as any[]).reduce((sum, i) => sum + (i.total || 0), 0);

    return {
      totalClients: tc,
      totalProjects: tp,
      activeProjects: ap,
      revenue: totalRev,
      name: (fData as any)?.businessName || "Business HQ",
      owner: (fData as any)?.ownerName || "Operator",
      recentLogs: logs
    };
  } catch (e) {
    return { totalClients: 0, totalProjects: 0, activeProjects: 0, revenue: 0, name: "Business HQ", owner: "Operator", recentLogs: [] };
  }
}

export default async function FranchiseDashboardPage() {
  const auth = await getErpAuth();
  const fid = auth?.franchiseId || "";
  const core = await getFranchiseIntelligence(fid);

  return (
    <div className="space-y-8">
      <PageHeader title={core.name} subtitle={`Strategic command hub overseen by executive ${core.owner}.`} action={
        <Link href="/erp/franchise/projects" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all"><Play size={14} fill="currentColor"/> Mission Control</Link>
      } />

      {/* Executive Quant Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Captured Pipeline" value={core.totalProjects} icon="Briefcase" color="indigo" />
        <StatCard title="Live Campaigns" value={core.activeProjects} icon="Briefcase" color="green" />
        <StatCard title="Verified Clients" value={core.totalClients} icon="Users" color="blue" />
        <div className="bg-slate-900 dark:bg-white rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl group">
          <div className="absolute top-[-10px] right-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500"><IndianRupee size={100} className="text-white dark:text-slate-900" /></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 relative z-10">Authorized Revenue</p>
          <h3 className="text-2xl font-black text-white dark:text-slate-900 flex items-center relative z-10"><IndianRupee size={20}/>{core.revenue.toLocaleString()}</h3>
          <div className="mt-4 pt-3 border-t border-slate-800 dark:border-slate-100 text-[10px] font-bold text-emerald-400 dark:text-emerald-600 flex items-center gap-1 relative z-10"><ArrowUpRight size={12}/> Secure Ledger Liquidity</div>
        </div>
      </div>

      {/* Real-Time Monitoring & Grid Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-8 relative overflow-hidden flex flex-col justify-center min-h-[250px] border-l-4 border-l-indigo-600">
             <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.02]"><Briefcase size={200}/></div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Execute High-Impact Growth.</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md leading-relaxed mb-6">Deploy comprehensive CRM methodologies, streamline project sequencing, and broadcast milestone tax documentation from one consolidated visual perimeter.</p>
             <div className="flex gap-3">
                <Link href="/erp/franchise/clients" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 transition-all">Enroll Clients</Link>
             </div>
          </Card>
        </div>

        {/* Mission Logs Component */}
        <div className="bg-white dark:bg-[#0f172a] border dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-800">
             <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2"><Clock size={16} className="text-indigo-500"/> Live Activity Matrix</h3>
          </div>
          
          <div className="space-y-5 flex-1 overflow-y-auto max-h-[320px] pr-2">
            {core.recentLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-700 font-bold text-xs italic">No matrix noise detected.</div>
            ) : core.recentLogs.map((log: any) => (
              <div key={log._id} className="flex gap-3 group relative">
                 <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(99,102,241,0.5)] mt-1.5"/>
                    <div className="w-px flex-1 bg-slate-100 dark:bg-slate-800 my-1"/>
                 </div>
                 <div className="pb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.module}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-2">{log.details}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

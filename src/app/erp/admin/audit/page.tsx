import React from "react";
import { PageHeader } from "@/components/erp/ui/Shared";
import { getErpAuth } from "@/lib/erp/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import ErpAuditLog from "@/models/erp/ErpAuditLog";

async function fetchAudits() {
  await connectDB();
  return await ErpAuditLog.find({})
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(100);
}

export default async function AuditLogPage() {
  const auth = await getErpAuth();
  if (!auth || auth.role !== "ADMIN") redirect("/erp/login");

  const logs = await fetchAudits();

  return (
    <div>
      <PageHeader title="Security Audits" subtitle="Tamper-evident chronological operational trail." />
      <div className="overflow-hidden bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-xs tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Context/Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 dark:text-slate-300">
              {logs.map((l: any) => (
                <tr key={l._id.toString()} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-mono text-xs text-slate-400">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="p-4 font-medium">{l.userId?.name || "System"}</td>
                  <td className="p-4"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold">{l.action}</span></td>
                  <td className="p-4">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

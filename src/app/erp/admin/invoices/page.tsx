"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Card, TableSkeleton, Badge } from "@/components/erp/ui/Shared";
import { IndianRupee, CheckCircle2, ShieldAlert, Eye, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminInvoicesPage() {
  const [invs, setInvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/erp/admin/invoices");
      const d = await r.json();
      if (r.ok) setInvs(d.data);
    } catch (e) { toast.error("Fail"); }
    finally { setLoading(false); }
  };

  const approveInvoice = async (id: string) => {
    setActing(id);
    try {
      const r = await fetch(`/api/erp/admin/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" })
      });
      if (r.ok) { toast.success("Document authorized."); fetchAll(); }
    } catch(e) { toast.error("Auth error"); }
    finally { setActing(null); }
  };

  return (
    <div>
      <PageHeader title="Settlement Authority" subtitle="Verify and authorize drafted commercial tax documents for dispatch." />
      {loading ? <TableSkeleton rows={6}/> : invs.length === 0 ? (
        <Card className="p-20 text-center border-dashed"><ShieldAlert className="mx-auto opacity-10 w-16 h-16 mb-2"/><h3 className="font-black opacity-30">Authorization Vault Zero</h3></Card>
      ) : (
        <div className="bg-white dark:bg-[#0f172a] border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <tr>
                  <th className="px-6 py-4">Region Agent</th>
                  <th className="px-6 py-4">Document Ref</th>
                  <th className="px-6 py-4">Sum Total</th>
                  <th className="px-6 py-4">State</th>
                  <th className="px-6 py-4 text-right">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800/50">
                {invs.map((i) => (
                  <tr key={i._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5"><div className="font-black text-slate-900 dark:text-white">{i.franchiseId?.businessName || "N/A"}</div><div className="text-[10px] text-slate-400 uppercase mt-0.5">{i.clientId?.name}</div></td>
                    <td className="px-6 py-5 font-mono font-bold text-indigo-600">{i.invoiceNumber}</td>
                    <td className="px-6 py-5 font-black flex items-center gap-0.5 text-base dark:text-white mt-1"><IndianRupee size={14}/>{(i.total || i.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-5"><Badge label={i.status} type={i.status === 'Approved' || i.status === 'Paid' ? 'success' : i.status === 'Draft' ? 'warning' : 'neutral'} /></td>
                    <td className="px-6 py-5 text-right">
                      {i.status === 'Draft' ? (
                        <button 
                          onClick={() => approveInvoice(i._id)}
                          disabled={!!acting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-lg flex items-center justify-center gap-1.5 ml-auto disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {acting === i._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 size={12} />}
                          Authorize
                        </button>
                      ) : (
                        <div className="flex items-center justify-end text-emerald-600 gap-1 font-bold text-xs uppercase"><CheckCircle2 size={14}/> Authorized</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

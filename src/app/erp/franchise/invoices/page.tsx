"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Card, TableSkeleton, Modal, Badge } from "@/components/erp/ui/Shared";
import { FileText, IndianRupee, Eye, Printer, Download, ShieldCheck, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function FranchiseInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInv, setSelectedInv] = useState<any>(null);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/erp/franchise/invoices");
      const d = await r.json();
      if (r.ok) setInvoices(d.data);
    } catch (e) { toast.error("Sync error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Tax Invoices" subtitle="Secure audit log of all legally generated corporate billings." />
      
      {loading ? <TableSkeleton rows={6}/> : invoices.length === 0 ? (
        <Card className="p-20 flex flex-col items-center justify-center text-center border-dashed bg-slate-50/20">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4"><FileText className="text-slate-300 w-8 h-8" /></div>
          <h3 className="font-black text-slate-900 dark:text-white">Vault Currently Empty</h3>
          <p className="text-slate-400 text-sm max-w-xs mt-1">Initiate dynamic billing by clicking 'Milestone Billing' inside your Project Portfolio.</p>
        </Card>
      ) : (
        <div className="overflow-hidden border dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0f172a] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Document Ref</th>
                  <th className="px-6 py-4">Assigned Venture</th>
                  <th className="px-6 py-4">Settlement Status</th>
                  <th className="px-6 py-4 text-right">Net Total</th>
                  <th className="px-6 py-4 text-center">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                    <td className="px-6 py-5 font-mono font-bold text-slate-900 dark:text-indigo-400 text-sm">{inv.invoiceNumber}</td>
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-800 dark:text-slate-200 leading-tight">{inv.projectId?.name || "Archived"}</div>
                      <div className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">{inv.clientId?.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge label={inv.status} type={inv.status === 'Paid' ? 'success' : 'warning'} />
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white text-base flex items-center justify-end mt-1"><IndianRupee size={14}/>{(inv.total || inv.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => setSelectedInv(inv)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all mx-auto cursor-pointer">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Document Viewer Detail Modal */}
      <Modal isOpen={!!selectedInv} onClose={() => setSelectedInv(null)} title="Corporate Tax Document">
        {selectedInv && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] opacity-5 dark:opacity-[0.02] rotate-12"><ShieldCheck size={180}/></div>
              <div className="flex justify-between items-start mb-6 relative">
                <div>
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Commercial Receipt</div>
                  <h2 className="text-2xl font-black dark:text-white">{selectedInv.invoiceNumber}</h2>
                  <p className="text-xs text-slate-400 mt-1">Dated: {new Date(selectedInv.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge label={selectedInv.status} type={selectedInv.status === 'Paid' ? 'success' : 'warning'} />
              </div>
              
              <div className="space-y-4 border-t border-dashed dark:border-slate-700 pt-4 relative">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs font-bold text-slate-400 uppercase">Authorized Client</p><p className="font-black text-slate-900 dark:text-slate-200 mt-0.5">{selectedInv.clientId?.name}</p></div>
                  <div><p className="text-xs font-bold text-slate-400 uppercase">Related Initiative</p><p className="font-bold text-slate-600 dark:text-slate-400 mt-0.5">{selectedInv.projectId?.name}</p></div>
                </div>

                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-800 mt-6">
                  <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2 mb-2">
                    <span className="text-xs font-bold text-slate-400">Line Item / Description</span>
                    <span className="text-xs font-bold text-slate-400">Computation</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-bold dark:text-white">Milestone Basis Breakdown</span>
                    <span className="text-sm font-bold flex items-center dark:text-white"><IndianRupee size={12}/>{(selectedInv.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 py-1">
                    <span className="text-xs">Applicable Governance Tax</span>
                    <span className="text-xs flex items-center"><IndianRupee size={10}/>{(selectedInv.tax || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-black text-slate-900 dark:text-white">Total Settlement Due</span>
                    <span className="font-black text-xl text-indigo-600 dark:text-indigo-400 flex items-center"><IndianRupee size={16}/>{(selectedInv.total || selectedInv.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-3">
              {selectedInv.status === "Draft" ? (
                <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-3 rounded-xl font-black text-[10px] uppercase text-center flex items-center justify-center gap-1.5 border dark:border-slate-700 cursor-not-allowed">
                  <ShieldCheck size={12} className="opacity-50"/> Awaiting Auth
                </div>
              ) : (
                <button 
                  onClick={() => {
                    const clientName = selectedInv.clientId?.name || "Client";
                    const sub = encodeURIComponent(`Tax Invoice Generated - ${selectedInv.invoiceNumber}`);
                    const body = encodeURIComponent(`Dear ${clientName},\n\nAttached is the invoice ${selectedInv.invoiceNumber} for the project ${selectedInv.projectId?.name}.\n\nTotal Due: ₹${selectedInv.total || selectedInv.amount}\n\nPlease acknowledge.\n\nRegards,\nFinance Team`);
                    window.location.href = `mailto:${selectedInv.clientId?.email || ""}?subject=${sub}&body=${body}`;
                  }}
                  className="bg-indigo-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 shadow-lg transition-colors"
                >
                  <Mail size={14}/> Mail Client
                </button>
              )}
              <button onClick={() => window.print()} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"><Printer size={14}/> Print</button>
              <button onClick={() => setSelectedInv(null)} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">Dismiss</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

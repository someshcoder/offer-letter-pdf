import React from "react";
import { PageHeader, Card } from "@/components/erp/ui/Shared";
import { CreditCard, IndianRupee } from "lucide-react";

export default function FranchisePaymentsPage() {
  return (
    <div>
      <PageHeader title="Payment Disbursements" subtitle="Monitor deposits, upload transaction receipts, and verify clearance." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-l-4 border-l-emerald-500"><p className="text-xs font-bold uppercase text-slate-400">Cleared</p><h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center"><IndianRupee size={22}/>0.00</h2></Card>
        <Card className="p-6 border-l-4 border-l-amber-500"><p className="text-xs font-bold uppercase text-slate-400">Locked/Pending</p><h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center"><IndianRupee size={22}/>0.00</h2></Card>
        <Card className="p-6 border-l-4 border-l-indigo-500"><p className="text-xs font-bold uppercase text-slate-400">Next Projection</p><h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center"><IndianRupee size={22}/>0.00</h2></Card>
      </div>
      <Card className="p-16 text-center">
        <CreditCard className="mx-auto w-12 h-12 text-slate-300 mb-3" />
        <h3 className="font-bold text-slate-800 dark:text-white">Ledger Cleared</h3>
        <p className="text-sm text-slate-500 mt-1">Detailed transactional records are populated after initial project settlement triggers.</p>
      </Card>
    </div>
  );
}

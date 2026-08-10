import React from "react";
import { PageHeader, Card } from "@/components/erp/ui/Shared";
import { CreditCard } from "lucide-react";

export default function AdminPaymentsPage() {
  return (
    <div>
      <PageHeader title="Payment Verifications" subtitle="Super-admin channel for clearing inter-regional funds." />
      <Card className="p-24 text-center bg-slate-50/50 dark:bg-[#0f172a] border-dashed"><CreditCard className="mx-auto text-slate-300 dark:text-slate-700 w-16 h-16 mb-4" /><h3 className="font-bold dark:text-white">No Pending Validations</h3></Card>
    </div>
  );
}

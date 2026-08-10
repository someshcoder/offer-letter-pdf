import React from "react";
import { PageHeader, Card } from "@/components/erp/ui/Shared";
import { getErpAuth } from "@/lib/erp/auth";

export default async function FranchiseSettingsPage() {
  const auth = await getErpAuth();
  return (
    <div>
      <PageHeader title="Panel Configuration" subtitle="Customization and administrative settings for your workspace." />
      <div className="grid gap-6 max-w-2xl">
        <Card className="p-6">
          <h3 className="font-bold text-lg border-b dark:border-slate-800 pb-2 mb-4 dark:text-white">Profile</h3>
          <div className="space-y-4">
            <div><label className="text-xs font-bold text-slate-400">Email ID</label><p className="font-medium dark:text-white">{auth?.email}</p></div>
            <div><label className="text-xs font-bold text-slate-400">Entity Category</label><p className="font-medium dark:text-white">Independent Licensed Franchise</p></div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-lg border-b dark:border-slate-800 pb-2 mb-4 dark:text-white">Preferences</h3>
          <p className="text-sm text-slate-400 italic">Coming soon: Dark/Light persistent overrides, email notification preferences.</p>
        </Card>
      </div>
    </div>
  );
}

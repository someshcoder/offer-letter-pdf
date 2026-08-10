import { redirect } from "next/navigation";
import { getErpAuth } from "@/lib/erp/auth";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/erp/ui/Shared";

const CompanySettingsForm = dynamic(() => import("@/components/settings/CompanySettingsForm"));

export const metadata = {
  title: "Settings - Admin ERP Dashboard",
};

export default async function ErpSettingsPage() {
  const auth = await getErpAuth();

  if (!auth || auth.role !== "ADMIN") {
    redirect("/erp/login?error=unauthorized");
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Global Settings" 
        subtitle="Manage your company details and organizational structure." 
      />
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <CompanySettingsForm />
      </div>
    </div>
  );
}

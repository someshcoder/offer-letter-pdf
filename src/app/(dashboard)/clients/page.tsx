"use client";

import ClientManagementClient from "@/components/ClientManagementClient";
import { CustomersPageHeader } from "@/components/CustomersPageHeader";

export default function ClientsPage() {
  return (
    <div className="min-h-screen flex-1 px-3 py-4 sm:px-5 sm:py-6 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
        <CustomersPageHeader />
        <ClientManagementClient />
      </div>
    </div>
  );
}

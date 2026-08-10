import { redirect } from "next/navigation";
import { getErpAuth } from "@/lib/erp/auth";
import DashboardShell from "@/components/erp/layout/DashboardShell";
import { 
  LayoutDashboard, Users, Briefcase, 
  CreditCard, FileText, Bell, Settings
} from "lucide-react";

export const metadata = {
  title: "Franchise Portal",
  description: "Franchise Project Management",
};

const franchiseNavItems: any[] = [
  { label: "Dashboard", href: "/erp/franchise", icon: "LayoutDashboard" },
  { label: "Clients", href: "/erp/franchise/clients", icon: "Users" },
  { label: "Projects", href: "/erp/franchise/projects", icon: "Briefcase" },
  { label: "Invoices", href: "/erp/franchise/invoices", icon: "FileText" },
  { label: "Payments", href: "/erp/franchise/payments", icon: "CreditCard" },
  { label: "Settings", href: "/erp/franchise/settings", icon: "Settings" },
];

export default async function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getErpAuth();

  if (!auth || auth.role !== "FRANCHISE") {
    redirect("/erp/login?error=unauthorized");
  }

  return (
    <DashboardShell 
      navItems={franchiseNavItems} 
      role="Franchise" 
      userName={auth.email.split("@")[0]}
    >
      {children}
    </DashboardShell>
  );
}

import type { AccessRole } from "@/types/employee";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
  kind?: "Flow" | "Record" | "Tool" | "Document";
  roles: AccessRole[];
};

export type NavSection = {
  id: string;
  label: string;
  roles: AccessRole[];
  collapsible?: boolean;
  items: NavItem[];
};

/** Single source of truth — sidebar order & grouping */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    roles: ["Admin", "HR", "TL", "Employee"],
    items: [
      { href: "/dashboard", label: "Dashboard", description: "Summary, analytics & service KPIs", kind: "Tool", roles: ["Admin", "HR", "TL"] },
      { href: "/sales/dashboard", label: "Sales Dashboard", description: "Sales, payments & prize progress", kind: "Tool", roles: ["Admin", "HR", "TL", "Employee"] },
      { href: "/employee-dashboard", label: "My Tasks", description: "Assigned tasks & updates", kind: "Flow", roles: ["Employee"] },
      { href: "/tl-dashboard", label: "TL Dashboard", description: "My team, tasks & progress", kind: "Flow", roles: ["TL"] },
    ],
  },
  {
    id: "people",
    label: "People & HR",
    roles: ["Admin", "HR", "TL"],
    items: [
      { href: "/employees", label: "Employees", description: "Main staff master record", kind: "Record", roles: ["Admin", "HR", "TL"] },
      { href: "/tls", label: "TL Management", description: "TL wise employee teams", kind: "Flow", roles: ["Admin", "HR"] },
      { href: "/attendance", label: "Salary Calculator", description: "Calculate, save & view salary", kind: "Tool", roles: ["Admin", "HR"] },
    ],
  },
  {
    id: "sales",
    label: "Sales & Customers",
    roles: ["Admin", "HR", "TL", "Employee"],
    items: [
      { href: "/sales/leads", label: "Sales Leads", description: "Lead to customer pipeline", kind: "Flow", roles: ["Admin", "HR", "TL", "Employee"] },
      { href: "/clients", label: "Customers", description: "Contact, company, status & notes", kind: "Record", roles: ["Admin", "HR", "TL", "Employee"] },
      {
        href: "/payments",
        label: "Customer Payments",
        description: "Collect & track payments for your customers",
        kind: "Flow",
        roles: ["Admin", "HR", "TL", "Employee"],
      },
      {
        href: "/sales/prizes",
        label: "Sales Prizes",
        description: "Set reward targets for sales team",
        kind: "Tool",
        roles: ["Admin", "HR"],
      },
    ],
  },
  {
    id: "projects",
    label: "Projects & Delivery",
    roles: ["Admin", "HR", "TL"],
    items: [
      { href: "/projects", label: "Projects", description: "Customer work + linked domain/payment", kind: "Flow", roles: ["Admin", "HR", "TL"] },
      { href: "/staff-allocation", label: "Staff Allocation", description: "Who works on which project", kind: "Flow", roles: ["Admin", "HR", "TL"] },
      { href: "/milestones", label: "Milestones", description: "Project deadlines & progress", kind: "Record", roles: ["Admin", "HR", "TL"] },
      { href: "/tasks", label: "Tasks", description: "Daily work tracking", kind: "Record", roles: ["Admin", "HR", "TL", "Employee"] },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    roles: ["Admin", "HR"],
    items: [
      { href: "/payment-ledger", label: "Payment Summary", description: "Incoming, due & outgoing — read only", kind: "Tool", roles: ["Admin", "HR"] },
      { href: "/staff-expenses", label: "Staff Expenses", description: "Employee reimbursement (travel, food…)", kind: "Record", roles: ["Admin", "HR", "TL", "Employee"] },
      { href: "/office-expenses", label: "Office Expenses", description: "Rent, bills, office supplies", kind: "Record", roles: ["Admin", "HR"] },
    ],
  },
  {
    id: "service",
    label: "Service",
    roles: ["Admin", "HR", "TL"],
    items: [
      { href: "/maintenance", label: "Maintenance", description: "Project service/AMC records", kind: "Record", roles: ["Admin", "HR", "TL"] },
      { href: "/domains", label: "Domains", description: "Domain tied to customer/project", kind: "Record", roles: ["Admin", "HR"] },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    roles: ["Admin", "HR", "TL"],
    collapsible: true,
    items: [
      { href: "/offer-letter", label: "Offer Letter", description: "Create & manage offer PDFs", kind: "Document", roles: ["Admin", "HR", "TL"] },
      { href: "/experience-letter", label: "Experience Letter", description: "Experience certificates", kind: "Document", roles: ["Admin", "HR", "TL"] },
      { href: "/other", label: "Other Documents", description: "Custom document editor", kind: "Document", roles: ["Admin", "HR"] },
    ],
  },
  {
    id: "system",
    label: "System",
    roles: ["Admin", "HR", "TL", "Employee"],
    items: [
      { href: "/notifications", label: "Notifications", description: "Alerts & reminders", kind: "Tool", roles: ["Admin", "HR", "TL", "Employee"] },
      { href: "/reports", label: "Reports", description: "Export all records", kind: "Tool", roles: ["Admin", "HR"] },
      { href: "/login-sessions", label: "Login Sessions", description: "Online users & portal duration", kind: "Tool", roles: ["Admin", "HR"] },
      { href: "/settings", label: "Settings", description: "Company, roles, module guide", kind: "Tool", roles: ["Admin", "HR"] },
    ],
  },
];

export function getVisibleSections(role: AccessRole | undefined): NavSection[] {
  if (!role) return [];
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.roles.includes(role) && section.items.length > 0);
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const rolePrefixCache = new Map<AccessRole, string[]>();

export function getRoleAllowedPrefixes(role: AccessRole): string[] {
  const cached = rolePrefixCache.get(role);
  if (cached) return cached;
  const prefixes = new Set<string>();
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.roles.includes(role)) prefixes.add(item.href);
    }
  }
  const list = Array.from(prefixes);
  rolePrefixCache.set(role, list);
  return list;
}

export function isPathAllowedForRole(pathname: string, role: AccessRole): boolean {
  return getRoleAllowedPrefixes(role).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function defaultRouteForRole(role: AccessRole): string {
  if (role === "Employee") return "/sales/dashboard";
  if (role === "TL") return "/tl-dashboard";
  return "/dashboard";
}

export function findNavItem(pathname: string, role: AccessRole | undefined) {
  if (!role) return null;
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.roles.includes(role) && isNavActive(pathname, item.href)) {
        return { section, item };
      }
    }
  }
  return null;
}

/** Business module registry — route, API, labels aligned */
export const MODULE_REGISTRY = {
  leads: { route: "/sales/leads", api: "/api/sales/leads", title: "Sales Leads", section: "Sales & Customers" },
  customers: { route: "/clients", api: "/api/clients", title: "Customers", section: "Sales & Customers" },
  projects: { route: "/projects", api: "/api/projects", title: "Projects", section: "Projects & Delivery" },
  staffAllocation: { route: "/staff-allocation", api: "/api/staff-allocations", title: "Staff Allocation", section: "Projects & Delivery" },
  milestones: { route: "/milestones", api: "/api/milestones", title: "Milestones", section: "Projects & Delivery" },
  tls: { route: "/tls", api: "/api/tls/assign", title: "TL Management", section: "People & HR" },
  tasks: { route: "/tasks", api: "/api/tasks", title: "Tasks", section: "Projects & Delivery" },
  payments: { route: "/payments", api: "/api/payments", title: "Customer Payments", section: "Sales & Customers" },
  salesDashboard: { route: "/sales/dashboard", api: "/api/sales/performance", title: "Sales Dashboard", section: "Sales & Customers" },
  salesPrizes: { route: "/sales/prizes", api: "/api/sales/prizes", title: "Sales Prizes", section: "Sales & Customers" },
  paymentLedger: { route: "/payment-ledger", api: "/api/payment-ledger", title: "Payment Summary", section: "Finance" },
  staffExpenses: { route: "/staff-expenses", api: "/api/staff-expenses", title: "Staff Expenses", section: "Finance" },
  officeExpenses: { route: "/office-expenses", api: "/api/office-expenses", title: "Office Expenses", section: "Finance" },
  maintenance: { route: "/maintenance", api: "/api/maintenance", title: "Maintenance", section: "Service" },
  renewals: { route: "/renewals", api: "/api/renewals", title: "Renewals", section: "Service" },
  domains: { route: "/domains", api: "/api/domains", title: "Domains", section: "Service" },
  notifications: { route: "/notifications", api: "/api/notifications", title: "Notifications", section: "System" },
  reports: { route: "/reports", api: "/api/reports", title: "Reports", section: "System" },
  employeeDashboard: { route: "/employee-dashboard", api: "/api/tasks", title: "My Dashboard", section: "Overview" },
  tlDashboard: { route: "/tl-dashboard", api: "/api/tl-dashboard", title: "TL Dashboard", section: "Overview" },
  loginSessions: { route: "/login-sessions", api: "/api/login-sessions", title: "Login Sessions", section: "System" },
} as const;

export const DOCUMENT_MODULES = {
  offerLetter: { route: "/offer-letter", api: "/api/pdfs", fileApi: "/api/pdfs", title: "Offer Letter", section: "Documents" },
  experienceLetter: { route: "/experience-letter", api: "/api/experience-letters", fileApi: "/api/experience-letters", title: "Experience Letter", section: "Documents" },
  other: { route: "/other", api: "/api/other-documents", fileApi: "/api/other-documents", title: "Other Documents", section: "Documents" },
} as const;

export function getModuleByRoute(route: string) {
  return Object.values(MODULE_REGISTRY).find((m) => m.route === route);
}

export function moduleBreadcrumbs(route: string) {
  const mod = getModuleByRoute(route);
  if (!mod) {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }
  return [
    { label: "Dashboard", href: "/dashboard" },
    { label: mod.section },
    { label: mod.title },
  ];
}

export function documentBreadcrumbs(key: keyof typeof DOCUMENT_MODULES) {
  const mod = DOCUMENT_MODULES[key];
  return [
    { label: "Dashboard", href: "/dashboard" },
    { label: mod.section },
    { label: mod.title },
  ];
}

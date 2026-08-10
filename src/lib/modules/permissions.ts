import type { AccessRole } from "@/types/employee";
import type { ModuleName } from "@/types/modules/common";

const MODULE_ROLES: Record<ModuleName, AccessRole[]> = {
  sales: ["Admin", "HR", "TL", "Employee"],
  customer: ["Admin", "HR", "TL", "Employee"],
  project: ["Admin", "HR", "TL"],
  staff_allocation: ["Admin", "HR", "TL"],
  milestone: ["Admin", "HR", "TL"],
  payment: ["Admin", "HR", "TL", "Employee"],
  service_charge: ["Admin", "HR"],
  maintenance: ["Admin", "HR", "TL"],
  renewal: ["Admin", "HR"],
  staff_expense: ["Admin", "HR", "TL", "Employee"],
  office_expense: ["Admin", "HR"],
  asset: ["Admin", "HR"],
  purchase: ["Admin", "HR"],
  domain: ["Admin", "HR"],
  salary: ["Admin", "HR"],
  task: ["Admin", "HR", "TL", "Employee"],
  notification: ["Admin", "HR", "TL", "Employee"],
  report: ["Admin", "HR"],
};

export function canAccessModule(role: AccessRole, module: ModuleName): boolean {
  return MODULE_ROLES[module].includes(role);
}

export function requireModuleAccess(
  role: AccessRole,
  module: ModuleName,
): { ok: true } | { ok: false; message: string } {
  if (!canAccessModule(role, module)) {
    return { ok: false, message: "You do not have permission to access this module." };
  }
  return { ok: true };
}

export function isAdminOrHR(role: AccessRole): boolean {
  return role === "Admin" || role === "HR";
}

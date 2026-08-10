import type { AccessRole } from "@/types/employee";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type ListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  includeDeleted?: boolean;
};

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "status_change"
  | "convert"
  | "assign"
  | "approve"
  | "reject";

export type ModuleName =
  | "sales"
  | "customer"
  | "project"
  | "staff_allocation"
  | "milestone"
  | "payment"
  | "service_charge"
  | "maintenance"
  | "renewal"
  | "staff_expense"
  | "office_expense"
  | "asset"
  | "purchase"
  | "domain"
  | "salary"
  | "task"
  | "notification"
  | "report";

export type ActorInfo = {
  userId: string;
  email: string;
  role: AccessRole;
};

export type SoftDeleteFields = {
  deletedAt?: Date | null;
  deletedBy?: string | null;
  isActive: boolean;
};

export type TimestampActorFields = {
  createdBy?: string;
  updatedBy?: string;
};

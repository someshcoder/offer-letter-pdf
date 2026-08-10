export type ErpRole = "ADMIN" | "FRANCHISE";

export type ProjectStatus =
  | "Pending"
  | "Approved"
  | "In Progress"
  | "Invoice Generated"
  | "Payment Pending"
  | "Payment Verified"
  | "Completed";

export type PaymentStatus = "Pending" | "Verified" | "Rejected";

export type InvoiceStatus = "Draft" | "Approved" | "Generated" | "Paid" | "Cancelled";

export interface IErpUser {
  _id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: ErpRole;
  franchiseId?: string; // Reference if role is FRANCHISE
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IErpFranchise {
  _id?: string;
  ownerName: string;
  email: string;
  phone: string;
  businessName: string;
  location: string;
  status: "Active" | "Disabled";
  commissionPercentage: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IErpClient {
  _id?: string;
  franchiseId: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IErpProject {
  _id?: string;
  franchiseId: string;
  clientId: string;
  name: string;
  description?: string;
  budget: number;
  status: ProjectStatus;
  currentProgress: number; // 0 to 100
  adminApproval: boolean;
  rejectionReason?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IErpInvoice {
  _id?: string;
  projectId: string;
  clientId: string;
  franchiseId: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  dueDate: Date | string;
  status: InvoiceStatus;
  isLocked: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IErpPayment {
  _id?: string;
  projectId: string;
  franchiseId: string;
  invoiceId?: string;
  amount: number;
  paymentMode: string;
  transactionId: string;
  proofUrl?: string;
  status: PaymentStatus;
  adminRemarks?: string;
  verifiedAt?: Date | string;
  verifiedBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IErpAuditLog {
  _id?: string;
  userId: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  createdAt?: Date | string;
}

export interface IErpNotification {
  _id?: string;
  userId?: string; // null for broadcast
  role?: ErpRole;
  title: string;
  message: string;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
  createdAt?: Date | string;
}

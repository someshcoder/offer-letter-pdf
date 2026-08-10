import { z } from "zod";

export const nullableDate = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  return v;
}, z.coerce.date().optional());

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  status: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional(),
});

export const leadCreateSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().min(1),
  company: z.string().trim().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  assignedToName: z.string().optional(),
  notes: z.string().optional(),
  expectedValue: z.coerce.number().optional(),
  nextFollowUpDate: nullableDate,
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const followUpSchema = z.object({
  note: z.string().trim().min(1),
  followUpDate: nullableDate,
  status: z.string().optional(),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  clientId: z.string().min(1),
  leadId: z.string().optional(),
  budget: z.coerce.number().optional(),
  status: z.string().optional(),
  startDate: nullableDate,
  endDate: nullableDate,
  projectManagerId: z.string().optional(),
  projectManagerName: z.string().optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const staffAllocationSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  projectId: z.string().min(1),
  projectName: z.string().optional(),
  role: z.string().optional(),
  allocationPercent: z.coerce.number().min(0).max(100).optional(),
  startDate: nullableDate,
  endDate: nullableDate,
  notes: z.string().optional(),
});

export const milestoneSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  deadline: z.coerce.date(),
  progress: z.coerce.number().min(0).max(100).optional(),
  status: z.string().optional(),
});

export const paymentSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paymentType: z.string().optional(),
  totalAmount: z.coerce.number().min(0),
  paidAmount: z.coerce.number().optional(),
  gstPercent: z.coerce.number().optional(),
  discount: z.coerce.number().optional(),
  dueDate: nullableDate,
  notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().min(0.01),
  paymentMode: z.string().optional(),
  transactionRef: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const serviceChargeSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  chargeType: z.string().min(1),
  description: z.string().optional(),
  amount: z.coerce.number().min(0),
  gstPercent: z.coerce.number().optional(),
  discount: z.coerce.number().optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.string().optional(),
});

export const maintenanceSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  serviceType: z.string().optional(),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: nullableDate,
  expiryDate: nullableDate,
  renewalDate: nullableDate,
  assignedStaffId: z.string().optional(),
  assignedStaffName: z.string().optional(),
});

export const renewalSchema = z.object({
  clientId: z.string().optional(),
  domainId: z.string().optional(),
  serviceId: z.string().optional(),
  title: z.string().trim().min(1),
  renewalDate: z.coerce.date(),
  amount: z.coerce.number().optional(),
  paymentStatus: z.string().optional(),
  notes: z.string().optional(),
});

export const staffExpenseSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  category: z.string().min(1),
  amount: z.coerce.number().min(0),
  expenseDate: nullableDate,
  description: z.string().optional(),
});

export const officeExpenseSchema = z.object({
  category: z.string().min(1),
  title: z.string().trim().min(1),
  amount: z.coerce.number().min(0),
  expenseDate: nullableDate,
  vendor: z.string().optional(),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const assetSchema = z.object({
  assetType: z.string().min(1),
  name: z.string().trim().min(1),
  serialNumber: z.string().optional(),
  purchaseCost: z.coerce.number().optional(),
  purchaseDate: nullableDate,
  warrantyExpiry: nullableDate,
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const purchaseSchema = z.object({
  title: z.string().trim().min(1),
  vendor: z.string().trim().min(1),
  assetType: z.string().optional(),
  quantity: z.coerce.number().optional(),
  unitCost: z.coerce.number().min(0),
  notes: z.string().optional(),
  invoiceUrl: z.string().optional(),
});

export const domainSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  domainName: z.string().trim().min(1),
  registrar: z.string().optional(),
  purchaseDate: nullableDate,
  expiryDate: nullableDate,
  renewalReminderDate: nullableDate,
  autoNotify: z.boolean().optional(),
  hostingProvider: z.string().optional(),
  notes: z.string().optional(),
});

export const salarySchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  baseSalary: z.coerce.number().optional(),
  bonus: z.coerce.number().optional(),
  incentive: z.coerce.number().optional(),
  deduction: z.coerce.number().optional(),
  advanceSalary: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export const salaryCalculationSchema = z.object({
  employeeId: z.string().optional(),
  employeeName: z.string().trim().min(1),
  monthLabel: z.string().trim().min(1),
  monthlySalary: z.coerce.number().min(0),
  monthDays: z.coerce.number().min(1),
  unpaidLeaves: z.coerce.number().min(0).optional(),
  bonusAmount: z.coerce.number().min(0).optional(),
  bonusDays: z.coerce.number().min(0).optional(),
  deductionAmount: z.coerce.number().min(0).optional(),
  deductionDays: z.coerce.number().min(0).optional(),
  perDaySalary: z.coerce.number().optional(),
  payableDays: z.coerce.number().optional(),
  earnedSalary: z.coerce.number().optional(),
  bonusFromDays: z.coerce.number().optional(),
  totalBonus: z.coerce.number().optional(),
  deductionFromDays: z.coerce.number().optional(),
  totalDeductions: z.coerce.number().optional(),
  netSalary: z.coerce.number().optional(),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  startDate: nullableDate,
  dueDate: nullableDate,
  progress: z.coerce.number().optional(),
  employeeRemark: z.string().optional(),
  estimatedTime: z.string().optional(),
  actualTime: z.string().optional(),
  assignedStaffIds: z.array(z.string()).optional(),
  assignedStaffNames: z.array(z.string()).optional(),
  projectId: z.string().optional(),
});

export const taskCommentSchema = z.object({
  comment: z.string().trim().min(1),
});

export const customerAssignSchema = z.object({
  assignedStaffId: z.string().min(1),
  assignedStaffName: z.string().min(1),
});

export const customerNoteSchema = z.object({
  note: z.string().trim().min(1),
});

export const statusUpdateSchema = z.object({
  status: z.string().min(1),
  reason: z.string().optional(),
});

export const approvalSchema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  rejectionReason: z.string().optional(),
});

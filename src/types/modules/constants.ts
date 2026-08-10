export const LEAD_STATUSES = ["Draft", "New", "Pending", "In Review", "Approved", "Rejected", "Allocated", "In Progress", "On Hold", "Completed", "Cancelled", "Closed", "Archived"] as const;
export const LEAD_SOURCES = ["Website", "Referral", "Social Media", "Cold Call", "Email", "Walk-in", "Other"] as const;

export const PROJECT_STATUSES = [
  "Draft", "Pending Allocation", "Staff Assigned", "In Progress", "On Hold", "Completed", "Cancelled",
] as const;

export const MILESTONE_STATUSES = ["Pending", "In Progress", "Completed", "Overdue"] as const;

export const PAYMENT_TYPES = ["One Time", "Advance", "Partial", "Remaining"] as const;
export const PAYMENT_STATUSES = ["Pending", "Partial", "Paid", "Overdue", "Cancelled"] as const;

export const CHARGE_TYPES = [
  "Activation Charge", "Support Charge", "Monthly Charge", "One Time Charge", "Custom Charge",
] as const;

export const SERVICE_TYPES = ["Monthly Service", "One Time Service", "Maintenance Request"] as const;
export const SERVICE_STATUSES = ["Active", "Pending", "Completed", "Expired", "Cancelled"] as const;

export const RENEWAL_STATUSES = ["Upcoming", "Due", "Paid", "Overdue", "Cancelled"] as const;

export const EXPENSE_CATEGORIES = ["Travel", "Food", "Fuel", "Internet", "Other"] as const;
export const EXPENSE_STATUSES = ["Pending", "Approved", "Rejected", "Paid"] as const;

export const OFFICE_EXPENSE_CATEGORIES = [
  "Rent", "Electricity", "Internet", "Stationery", "Office Supplies", "Miscellaneous",
] as const;

export const ASSET_TYPES = ["Laptop", "Desktop", "Printer", "Furniture", "Vehicle", "Mobile", "AC", "Other"] as const;
export const ASSET_STATUSES = ["Available", "Assigned", "Under Repair", "Retired"] as const;

export const PURCHASE_STATUSES = ["Pending", "Approved", "Rejected", "Ordered", "Received"] as const;

export const DOMAIN_STATUSES = ["Active", "Expiring Soon", "Expired", "Transferred"] as const;

export const SALARY_STATUSES = ["Draft", "Processed", "Paid", "Cancelled"] as const;

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export const TASK_STATUSES = ["Pending", "In Progress", "Completed", "Overdue", "Cancelled"] as const;

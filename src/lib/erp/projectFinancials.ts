/** Snapshot attached to approved+ projects for franchise UI. */
export type ProjectFinancialSnapshot = {
  grossBudget: number;
  commissionPct: number;
  /** Platform / franchise commission on approved deal value (deduction line). */
  commissionAmount: number;
  /** Sum of invoice totals (non-draft, non-cancelled). */
  invoicedTotal: number;
  /** Sum of admin-verified payments for this project. */
  verifiedPaidTotal: number;
  /** What client still owes vs approved deal (budget − verified payments). */
  outstandingFromClient: number;
};

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function commissionOnGross(gross: number, pct: number): number {
  if (!Number.isFinite(gross) || gross <= 0) return 0;
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return roundMoney((gross * pct) / 100);
}

export function outstandingVsBudget(budget: number, verifiedPaid: number): number {
  if (!Number.isFinite(budget) || budget <= 0) return 0;
  const paid = Number.isFinite(verifiedPaid) && verifiedPaid > 0 ? verifiedPaid : 0;
  return roundMoney(Math.max(0, budget - paid));
}

export const POST_APPROVAL_STATUSES = new Set([
  "Approved",
  "In Progress",
  "Invoice Generated",
  "Payment Pending",
  "Payment Verified",
  "Completed",
]);

export function isPostApprovalProjectStatus(status: string): boolean {
  return POST_APPROVAL_STATUSES.has(status);
}

/** Normalize Mongo/ObjectId strings for reliable TL ↔ employee matching */
export function normalizeId(id: unknown): string {
  return String(id ?? "").trim().toLowerCase();
}

export function isEmployeeUnassigned(reportingTL?: {
  id?: string | null;
} | null): boolean {
  if (!reportingTL) return true;
  const id = normalizeId(reportingTL.id);
  return !id || id === "undefined" || id === "null";
}

/** MongoDB query: employees with role Employee and no TL assigned */
export function unassignedEmployeeFilter() {
  return {
    accessRole: "Employee",
    $or: [
      { reportingTL: { $exists: false } },
      { reportingTL: null },
      { "reportingTL.id": { $exists: false } },
      { "reportingTL.id": null },
      { "reportingTL.id": "" },
    ],
  };
}

export function membersForTl<T extends { reportingTL?: { id?: string | null } | null }>(
  employees: T[],
  tlId: string,
): T[] {
  const key = normalizeId(tlId);
  return employees.filter(
    (emp) => !isEmployeeUnassigned(emp.reportingTL) && normalizeId(emp.reportingTL?.id) === key,
  );
}

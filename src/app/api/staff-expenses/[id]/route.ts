import StaffExpense from "@/models/modules/StaffExpense";
import { createModuleIdHandlers } from "@/lib/modules/crudHandlers";
import { staffExpenseSchema } from "@/lib/modules/schemas";

const handlers = createModuleIdHandlers({ module: "staff_expense", Model: StaffExpense, updateSchema: staffExpenseSchema.partial() });
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

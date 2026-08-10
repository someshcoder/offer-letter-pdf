import OfficeExpense from "@/models/modules/OfficeExpense";
import { createModuleIdHandlers } from "@/lib/modules/crudHandlers";
import { officeExpenseSchema } from "@/lib/modules/schemas";

const handlers = createModuleIdHandlers({ module: "office_expense", Model: OfficeExpense, updateSchema: officeExpenseSchema.partial() });
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

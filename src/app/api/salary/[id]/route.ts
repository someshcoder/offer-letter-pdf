import SalaryRecord from "@/models/modules/SalaryRecord";
import { createModuleIdHandlers } from "@/lib/modules/crudHandlers";
import { salarySchema } from "@/lib/modules/schemas";

const handlers = createModuleIdHandlers({ module: "salary", Model: SalaryRecord, updateSchema: salarySchema.partial() });
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

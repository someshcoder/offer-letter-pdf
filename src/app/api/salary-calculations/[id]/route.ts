import SalaryCalculation from "@/models/modules/SalaryCalculation";
import { createModuleIdHandlers } from "@/lib/modules/crudHandlers";
import { salaryCalculationSchema } from "@/lib/modules/schemas";

const handlers = createModuleIdHandlers({
  module: "salary",
  Model: SalaryCalculation,
  updateSchema: salaryCalculationSchema.partial(),
});

export const DELETE = handlers.DELETE;

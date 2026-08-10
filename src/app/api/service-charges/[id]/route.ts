import ServiceCharge from "@/models/modules/ServiceCharge";
import { createModuleIdHandlers } from "@/lib/modules/crudHandlers";
import { serviceChargeSchema } from "@/lib/modules/schemas";

const handlers = createModuleIdHandlers({
  module: "service_charge",
  Model: ServiceCharge,
  updateSchema: serviceChargeSchema.partial(),
});

export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

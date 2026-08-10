import Renewal from "@/models/modules/Renewal";
import { createModuleIdHandlers } from "@/lib/modules/crudHandlers";
import { renewalSchema } from "@/lib/modules/schemas";

const handlers = createModuleIdHandlers({ module: "renewal", Model: Renewal, updateSchema: renewalSchema.partial() });
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

import Domain from "@/models/modules/Domain";
import { createModuleIdHandlers } from "@/lib/modules/crudHandlers";
import { domainSchema } from "@/lib/modules/schemas";

const handlers = createModuleIdHandlers({ module: "domain", Model: Domain, updateSchema: domainSchema.partial() });
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

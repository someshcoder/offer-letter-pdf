import PurchaseRequest from "@/models/modules/PurchaseRequest";
import { createModuleIdHandlers } from "@/lib/modules/crudHandlers";
import { purchaseSchema } from "@/lib/modules/schemas";

const handlers = createModuleIdHandlers({ module: "purchase", Model: PurchaseRequest, updateSchema: purchaseSchema.partial() });
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

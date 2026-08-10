import CompanyAsset from "@/models/modules/CompanyAsset";
import { createModuleIdHandlers } from "@/lib/modules/crudHandlers";
import { assetSchema } from "@/lib/modules/schemas";

const handlers = createModuleIdHandlers({ module: "asset", Model: CompanyAsset, updateSchema: assetSchema.partial() });
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

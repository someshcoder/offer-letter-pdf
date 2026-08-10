import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const ASSET_TYPES = ["Laptop", "Desktop", "Printer", "Furniture", "Vehicle", "Mobile", "AC", "Other"] as const;
export const ASSET_STATUSES = ["Available", "Assigned", "Under Repair", "Retired"] as const;

const CompanyAssetSchema = new Schema(
  {
    assetType: { type: String, enum: ASSET_TYPES, required: true, index: true },
    name: { type: String, required: true, trim: true },
    serialNumber: { type: String, trim: true, default: "", index: true },
    purchaseCost: { type: Number, default: 0, min: 0 },
    purchaseDate: { type: Date, default: null },
    warrantyExpiry: { type: Date, default: null },
    assignedToId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    assignedToName: { type: String, default: "" },
    status: { type: String, enum: ASSET_STATUSES, default: "Available", index: true },
    location: { type: String, default: "" },
    notes: { type: String, default: "" },
    purchaseRequestId: { type: Schema.Types.ObjectId, ref: "PurchaseRequest", default: null },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

const CompanyAsset = mongoose.models.CompanyAsset || mongoose.model("CompanyAsset", CompanyAssetSchema);

const AssetHistorySchema = new Schema(
  {
    assetId: { type: Schema.Types.ObjectId, ref: "CompanyAsset", index: true },
    action: { type: String, required: true },
    details: { type: String, default: "" },
    changedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AssetHistory =
  mongoose.models.AssetHistory || mongoose.model("AssetHistory", AssetHistorySchema);

export default CompanyAsset;

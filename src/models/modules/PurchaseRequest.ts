import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const PURCHASE_STATUSES = ["Pending", "Approved", "Rejected", "Ordered", "Received"] as const;

const PurchaseRequestSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    vendor: { type: String, required: true, trim: true },
    assetType: { type: String, default: "Other" },
    quantity: { type: Number, default: 1, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, default: 0 },
    status: { type: String, enum: PURCHASE_STATUSES, default: "Pending", index: true },
    invoiceUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    assetCreated: { type: Boolean, default: false },
    assetId: { type: Schema.Types.ObjectId, ref: "CompanyAsset", default: null },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

const PurchaseRequest =
  mongoose.models.PurchaseRequest || mongoose.model("PurchaseRequest", PurchaseRequestSchema);

export default PurchaseRequest;

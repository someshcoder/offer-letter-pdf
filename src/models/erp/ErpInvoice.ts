import mongoose, { Schema, Document, Model } from "mongoose";
import type { IErpInvoice } from "@/types/erp";

export interface IErpInvoiceDocument extends Omit<IErpInvoice, "_id" | "projectId" | "clientId" | "franchiseId">, Document {
  projectId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  franchiseId: mongoose.Types.ObjectId;
}

/** Must match `InvoiceStatus` in `types/erp.ts`. */
const INVOICE_STATUS_ENUM = [
  "Draft",
  "Approved",
  "Generated",
  "Paid",
  "Cancelled",
] as const;

const ErpInvoiceSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ErpProject", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "ErpClient", required: true, index: true },
    franchiseId: { type: Schema.Types.ObjectId, ref: "ErpFranchise", required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: [...INVOICE_STATUS_ENUM],
      default: "Draft",
    },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "erp_invoices" },
);

// Next.js can keep this module hot-reloaded while Mongoose keeps the old compiled model.
// `mongoose.models.X || model()` then NEVER applies a new schema — so `Draft` stays "invalid"
// until process restart. Drop the cached model whenever this file loads.
if (mongoose.models.ErpInvoice) {
  mongoose.deleteModel("ErpInvoice");
}

const ErpInvoice: Model<IErpInvoiceDocument> = mongoose.model<IErpInvoiceDocument>(
  "ErpInvoice",
  ErpInvoiceSchema,
);

export default ErpInvoice;

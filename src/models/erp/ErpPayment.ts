import mongoose, { Schema, Document, Model } from "mongoose";
import { IErpPayment } from "@/types/erp";

export interface IErpPaymentDocument extends Omit<IErpPayment, "_id" | "projectId" | "franchiseId" | "invoiceId" | "verifiedBy">, Document {
  projectId: mongoose.Types.ObjectId;
  franchiseId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
}

const ErpPaymentSchema = new Schema<IErpPaymentDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ErpProject", required: true },
    franchiseId: { type: Schema.Types.ObjectId, ref: "ErpFranchise", required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "ErpInvoice" },
    amount: { type: Number, required: true },
    paymentMode: { type: String, required: true },
    transactionId: { type: String, required: true },
    proofUrl: { type: String },
    status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" },
    adminRemarks: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "ErpUser" },
  },
  { timestamps: true, collection: "erp_payments" }
);

const ErpPayment: Model<IErpPaymentDocument> =
  mongoose.models.ErpPayment || mongoose.model<IErpPaymentDocument>("ErpPayment", ErpPaymentSchema);

export default ErpPayment;

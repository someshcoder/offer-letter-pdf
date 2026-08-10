import mongoose, { Schema, Document, Model } from "mongoose";
import { IErpAuditLog } from "@/types/erp";

export interface IErpAuditLogDocument extends Omit<IErpAuditLog, "_id" | "userId">, Document {
  userId: mongoose.Types.ObjectId;
}

const ErpAuditLogSchema = new Schema<IErpAuditLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "ErpUser", required: true, index: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "erp_auditlogs" }
);

const ErpAuditLog: Model<IErpAuditLogDocument> =
  mongoose.models.ErpAuditLog || mongoose.model<IErpAuditLogDocument>("ErpAuditLog", ErpAuditLogSchema);

export default ErpAuditLog;

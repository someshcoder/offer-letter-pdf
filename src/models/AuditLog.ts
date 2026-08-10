import mongoose, { Schema } from "mongoose";
import type { AuditAction, ModuleName } from "@/types/modules/common";

const AuditLogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, default: "" },
    action: { type: String, required: true },
    module: { type: String, required: true, index: true },
    entityId: { type: String, index: true },
    details: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "unknown" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ module: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export type IAuditLog = {
  _id: string;
  userId: string;
  userEmail?: string;
  action: AuditAction;
  module: ModuleName;
  entityId?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
};

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;

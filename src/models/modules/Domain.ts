import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const DOMAIN_STATUSES = ["Active", "Expiring Soon", "Expired", "Transferred"] as const;

const DomainSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    domainName: { type: String, required: true, trim: true, index: true },
    registrar: { type: String, default: "", trim: true },
    purchaseDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null, index: true },
    renewalReminderDate: { type: Date, default: null },
    autoNotify: { type: Boolean, default: true },
    status: { type: String, enum: DOMAIN_STATUSES, default: "Active", index: true },
    hostingProvider: { type: String, default: "" },
    notes: { type: String, default: "" },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

DomainSchema.index({ clientId: 1, projectId: 1 });

const Domain = mongoose.models.Domain || mongoose.model("Domain", DomainSchema);

const DomainHistorySchema = new Schema(
  {
    domainId: { type: Schema.Types.ObjectId, ref: "Domain", index: true },
    action: { type: String, required: true },
    details: { type: String, default: "" },
    changedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const DomainHistory =
  mongoose.models.DomainHistory || mongoose.model("DomainHistory", DomainHistorySchema);

export default Domain;

import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const RENEWAL_STATUSES = ["Upcoming", "Due", "Paid", "Overdue", "Cancelled"] as const;

const RenewalSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    domainId: { type: Schema.Types.ObjectId, ref: "Domain", default: null },
    serviceId: { type: Schema.Types.ObjectId, ref: "MaintenanceService", default: null },
    title: { type: String, required: true, trim: true },
    renewalDate: { type: Date, required: true, index: true },
    amount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: RENEWAL_STATUSES, default: "Upcoming", index: true },
    reminderSent: { type: Boolean, default: false },
    reminderDate: { type: Date, default: null },
    notes: { type: String, default: "" },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

const Renewal = mongoose.models.Renewal || mongoose.model("Renewal", RenewalSchema);

const RenewalHistorySchema = new Schema(
  {
    renewalId: { type: Schema.Types.ObjectId, ref: "Renewal", index: true },
    action: { type: String, required: true },
    details: { type: String, default: "" },
    changedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const RenewalHistory =
  mongoose.models.RenewalHistory || mongoose.model("RenewalHistory", RenewalHistorySchema);

export default Renewal;

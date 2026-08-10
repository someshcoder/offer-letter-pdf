import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const CHARGE_TYPES = [
  "Activation Charge",
  "Support Charge",
  "Monthly Charge",
  "One Time Charge",
  "Custom Charge",
] as const;

const ServiceChargeSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    chargeType: { type: String, enum: CHARGE_TYPES, required: true },
    description: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, default: 18, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0 },
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ["Monthly", "Yearly", "One Time"], default: "One Time" },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

const ServiceCharge =
  mongoose.models.ServiceCharge || mongoose.model("ServiceCharge", ServiceChargeSchema);

export default ServiceCharge;

import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const PRIZE_METRICS = [
  "customers",
  "leads",
  "converted_leads",
  "sales_value",
  "payments_received",
] as const;

export type PrizeMetric = (typeof PRIZE_METRICS)[number];

export const PRIZE_PERIODS = ["all_time", "monthly"] as const;
export type PrizePeriod = (typeof PRIZE_PERIODS)[number];

export const PRIZE_METRIC_LABELS: Record<PrizeMetric, string> = {
  customers: "Customers closed",
  leads: "Leads created",
  converted_leads: "Leads converted",
  sales_value: "Total sales value (₹)",
  payments_received: "Payment received (₹)",
};

const SalesPrizeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    /** What the employee gets when they hit the target */
    reward: { type: String, required: true, trim: true },
    metric: {
      type: String,
      enum: PRIZE_METRICS,
      required: true,
      index: true,
    },
    targetValue: { type: Number, required: true, min: 0 },
    period: {
      type: String,
      enum: PRIZE_PERIODS,
      default: "all_time",
      index: true,
    },
    sortOrder: { type: Number, default: 0 },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

SalesPrizeSchema.index({ isActive: 1, sortOrder: 1, targetValue: 1 });

const SalesPrize =
  mongoose.models.SalesPrize || mongoose.model("SalesPrize", SalesPrizeSchema);

export default SalesPrize;

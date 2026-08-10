import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const PAYMENT_TYPES = ["One Time", "Advance", "Partial", "Remaining"] as const;
export const PAYMENT_STATUSES = ["Pending", "Partial", "Paid", "Overdue", "Cancelled"] as const;

const MarketingPaymentSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    invoiceNumber: { type: String, trim: true, default: "", index: true },
    paymentType: { type: String, enum: PAYMENT_TYPES, default: "One Time" },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    gstPercent: { type: Number, default: 18, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: PAYMENT_STATUSES, default: "Pending", index: true },
    dueDate: { type: Date, default: null },
    receiptUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

const MarketingPayment =
  mongoose.models.MarketingPayment || mongoose.model("MarketingPayment", MarketingPaymentSchema);

const PaymentHistorySchema = new Schema(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: "MarketingPayment", index: true },
    amount: { type: Number, required: true },
    paymentMode: { type: String, default: "Bank Transfer" },
    transactionRef: { type: String, default: "" },
    paidAt: { type: Date, default: Date.now },
    receiptUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    recordedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PaymentHistory =
  mongoose.models.PaymentHistory || mongoose.model("PaymentHistory", PaymentHistorySchema);

export default MarketingPayment;

import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const EXPENSE_CATEGORIES = ["Travel", "Food", "Fuel", "Internet", "Other"] as const;
export const EXPENSE_STATUSES = ["Pending", "Approved", "Rejected", "Paid"] as const;

const UploadedFileSchema = new Schema(
  {
    fileName: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const StaffExpenseSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeName: { type: String, required: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, default: Date.now, index: true },
    description: { type: String, default: "" },
    status: { type: String, enum: EXPENSE_STATUSES, default: "Pending", index: true },
    attachment: { type: UploadedFileSchema, default: null },
    approvedBy: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

const StaffExpense = mongoose.models.StaffExpense || mongoose.model("StaffExpense", StaffExpenseSchema);
export default StaffExpense;

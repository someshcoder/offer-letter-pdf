import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const OFFICE_EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Internet",
  "Stationery",
  "Office Supplies",
  "Miscellaneous",
] as const;

const OfficeExpenseSchema = new Schema(
  {
    category: { type: String, enum: OFFICE_EXPENSE_CATEGORIES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, default: Date.now, index: true },
    vendor: { type: String, default: "" },
    description: { type: String, default: "" },
    receiptUrl: { type: String, default: "" },
    month: { type: Number, index: true },
    year: { type: Number, index: true },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

OfficeExpenseSchema.index({ year: 1, month: 1, category: 1 });

const OfficeExpense = mongoose.models.OfficeExpense || mongoose.model("OfficeExpense", OfficeExpenseSchema);
export default OfficeExpense;

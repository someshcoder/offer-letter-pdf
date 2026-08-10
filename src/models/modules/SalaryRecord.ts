import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const SALARY_STATUSES = ["Draft", "Processed", "Paid", "Cancelled"] as const;

const SalaryRecordSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeName: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12, index: true },
    year: { type: Number, required: true, index: true },
    baseSalary: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },
    deduction: { type: Number, default: 0 },
    advanceSalary: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: { type: String, enum: SALARY_STATUSES, default: "Draft", index: true },
    paymentDate: { type: Date, default: null },
    slipUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

SalaryRecordSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const SalaryRecord = mongoose.models.SalaryRecord || mongoose.model("SalaryRecord", SalaryRecordSchema);
export default SalaryRecord;

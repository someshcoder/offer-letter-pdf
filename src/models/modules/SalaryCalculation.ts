import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

const SalaryCalculationSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", index: true },
    employeeName: { type: String, required: true, trim: true },
    monthLabel: { type: String, required: true, trim: true },
    monthlySalary: { type: Number, default: 0 },
    monthDays: { type: Number, default: 30 },
    unpaidLeaves: { type: Number, default: 0 },
    bonusAmount: { type: Number, default: 0 },
    bonusDays: { type: Number, default: 0 },
    deductionAmount: { type: Number, default: 0 },
    deductionDays: { type: Number, default: 0 },
    perDaySalary: { type: Number, default: 0 },
    payableDays: { type: Number, default: 0 },
    earnedSalary: { type: Number, default: 0 },
    bonusFromDays: { type: Number, default: 0 },
    totalBonus: { type: Number, default: 0 },
    deductionFromDays: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

SalaryCalculationSchema.index({ employeeId: 1, monthLabel: 1, createdAt: -1 });
SalaryCalculationSchema.index({ createdAt: -1 });

const SalaryCalculation =
  mongoose.models.SalaryCalculation ||
  mongoose.model("SalaryCalculation", SalaryCalculationSchema);

export default SalaryCalculation;

import mongoose, { Schema } from "mongoose";
import { actorFields } from "@/lib/modules/softDelete";

const StaffAllocationSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeName: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    projectName: { type: String, default: "" },
    role: { type: String, default: "Member" },
    allocationPercent: { type: Number, default: 100, min: 0, max: 100 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, default: "" },
    ...actorFields,
  },
  { timestamps: true },
);

StaffAllocationSchema.index({ employeeId: 1, projectId: 1, isActive: 1 });

const StaffAllocation =
  mongoose.models.StaffAllocation || mongoose.model("StaffAllocation", StaffAllocationSchema);

const StaffAllocationHistorySchema = new Schema(
  {
    allocationId: { type: Schema.Types.ObjectId, ref: "StaffAllocation", index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    action: { type: String, enum: ["assigned", "updated", "removed"], required: true },
    details: { type: String, default: "" },
    changedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const StaffAllocationHistory =
  mongoose.models.StaffAllocationHistory ||
  mongoose.model("StaffAllocationHistory", StaffAllocationHistorySchema);

export default StaffAllocation;

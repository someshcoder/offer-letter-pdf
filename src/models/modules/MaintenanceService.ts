import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const SERVICE_TYPES = ["Monthly Service", "One Time Service", "Maintenance Request"] as const;
export const SERVICE_STATUSES = ["Active", "Pending", "Completed", "Expired", "Cancelled"] as const;

const MaintenanceServiceSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    serviceType: { type: String, enum: SERVICE_TYPES, default: "Maintenance Request" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: SERVICE_STATUSES, default: "Pending", index: true },
    startDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null, index: true },
    renewalDate: { type: Date, default: null, index: true },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    assignedStaffName: { type: String, default: "" },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

const MaintenanceService =
  mongoose.models.MaintenanceService || mongoose.model("MaintenanceService", MaintenanceServiceSchema);

const ServiceHistorySchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "MaintenanceService", index: true },
    action: { type: String, required: true },
    details: { type: String, default: "" },
    changedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ServiceHistory =
  mongoose.models.ServiceHistory || mongoose.model("ServiceHistory", ServiceHistorySchema);

export default MaintenanceService;

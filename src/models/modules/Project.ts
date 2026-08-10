import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const PROJECT_STATUSES = [
  "Draft",
  "Pending Allocation",
  "Staff Assigned",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
    budget: { type: Number, default: 0 },
    status: { type: String, enum: PROJECT_STATUSES, default: "Draft", index: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    assignedStaffIds: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
    projectManagerId: { type: String, default: "" },
    projectManagerName: { type: String, default: "" },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

ProjectSchema.index({ clientId: 1, status: 1 });
ProjectSchema.index({ name: "text", description: "text" });

const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);
export default Project;

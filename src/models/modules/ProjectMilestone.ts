import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const MILESTONE_STATUSES = ["Pending", "In Progress", "Completed", "Overdue"] as const;

const ProjectMilestoneSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    deadline: { type: Date, required: true, index: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: MILESTONE_STATUSES, default: "Pending", index: true },
    completedAt: { type: Date, default: null },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

const ProjectMilestone =
  mongoose.models.ProjectMilestone || mongoose.model("ProjectMilestone", ProjectMilestoneSchema);

const MilestoneHistorySchema = new Schema(
  {
    milestoneId: { type: Schema.Types.ObjectId, ref: "ProjectMilestone", index: true },
    action: { type: String, required: true },
    progress: { type: Number, default: 0 },
    details: { type: String, default: "" },
    changedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const MilestoneHistory =
  mongoose.models.MilestoneHistory || mongoose.model("MilestoneHistory", MilestoneHistorySchema);

export default ProjectMilestone;

import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export const TASK_STATUSES = ["Pending", "In Progress", "Completed", "Overdue", "Cancelled"] as const;

const AttachmentSchema = new Schema(
  {
    fileName: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String, default: "" },
  },
  { _id: true },
);

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "Medium", index: true },
    status: { type: String, enum: TASK_STATUSES, default: "Pending", index: true },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null, index: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    employeeRemark: { type: String, default: "" },
    estimatedTime: { type: String, default: "" },
    actualTime: { type: String, default: "" },
    assignedStaffIds: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
    assignedStaffNames: [{ type: String }],
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    attachments: [AttachmentSchema],
    completedAt: { type: Date, default: null },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

TaskSchema.index({ title: "text", description: "text" });
TaskSchema.index({ assignedStaffIds: 1, status: 1, dueDate: 1 });
TaskSchema.index({ createdBy: 1, updatedAt: -1 });
TaskSchema.index({ deletedAt: 1, dueDate: 1 });

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

const TaskCommentSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    comment: { type: String, required: true },
    authorId: { type: String, default: "" },
    authorName: { type: String, default: "" },
  },
  { timestamps: true },
);

export const TaskComment = mongoose.models.TaskComment || mongoose.model("TaskComment", TaskCommentSchema);

const TaskHistorySchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", index: true },
    action: { type: String, required: true },
    details: { type: String, default: "" },
    changedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const TaskHistory =
  mongoose.models.TaskHistory || mongoose.model("TaskHistory", TaskHistorySchema);

export default Task;

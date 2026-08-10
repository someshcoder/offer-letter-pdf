import mongoose, { Schema } from "mongoose";

export const NOTIFICATION_TYPES = [
  "pending_payment",
  "renewal_due",
  "domain_expiry",
  "staff_allocation",
  "new_customer",
  "project_completed",
  "salary_due",
  "maintenance_request",
  "task_assigned",
  "task_completed",
  "expense_approval",
  "general",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const NotificationSchema = new Schema(
  {
    userId: { type: String, index: true },
    targetRole: { type: String, enum: ["Admin", "HR", "TL", "Employee", "all"], default: "Admin" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "general", index: true },
    read: { type: Boolean, default: false, index: true },
    link: { type: String, default: "" },
    entityModule: { type: String, default: "" },
    entityId: { type: String, default: "" },
  },
  { timestamps: true },
);

NotificationSchema.index({ read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export type INotification = {
  _id: string;
  userId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  entityModule?: string;
  entityId?: string;
  createdAt: string;
  updatedAt: string;
};

const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export default Notification;

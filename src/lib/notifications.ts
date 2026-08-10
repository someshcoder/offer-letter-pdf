import Notification, { type NotificationType } from "@/models/Notification";
import connectDB from "@/lib/mongodb";

export async function createNotification({
  userId,
  targetRole = "Admin",
  title,
  message,
  type = "general",
  link = "",
  entityModule = "",
  entityId = "",
}: {
  userId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  entityModule?: string;
  entityId?: string;
}) {
  try {
    await connectDB();
    return await Notification.create({
      userId,
      targetRole,
      title,
      message,
      type,
      link,
      entityModule,
      entityId,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

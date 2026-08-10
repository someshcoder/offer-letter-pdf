import mongoose, { Schema, Document, Model } from "mongoose";
import { IErpNotification } from "@/types/erp";

export interface IErpNotificationDocument extends Omit<IErpNotification, "_id" | "userId">, Document {
  userId?: mongoose.Types.ObjectId;
}

const ErpNotificationSchema = new Schema<IErpNotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "ErpUser", index: true },
    role: { type: String, enum: ["ADMIN", "FRANCHISE"] },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ["info", "warning", "success", "error"], default: "info" },
  },
  { timestamps: true, collection: "erp_notifications" }
);

const ErpNotification: Model<IErpNotificationDocument> =
  mongoose.models.ErpNotification ||
  mongoose.model<IErpNotificationDocument>("ErpNotification", ErpNotificationSchema);

export default ErpNotification;

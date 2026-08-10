import mongoose, { Schema } from "mongoose";

const CustomerActivitySchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    action: { type: String, required: true },
    details: { type: String, default: "" },
    module: { type: String, default: "customer" },
    entityId: { type: String, default: "" },
    changedBy: { type: String, default: "" },
    changedByName: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

CustomerActivitySchema.index({ clientId: 1, createdAt: -1 });

export const CustomerActivity =
  mongoose.models.CustomerActivity || mongoose.model("CustomerActivity", CustomerActivitySchema);

const CustomerNoteSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    note: { type: String, required: true },
    createdBy: { type: String, default: "" },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

export const CustomerNote =
  mongoose.models.CustomerNote || mongoose.model("CustomerNote", CustomerNoteSchema);

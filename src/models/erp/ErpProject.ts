import mongoose, { Schema, Document, Model } from "mongoose";
import { IErpProject } from "@/types/erp";

export interface IErpProjectDocument extends Omit<IErpProject, "_id" | "franchiseId" | "clientId">, Document {
  franchiseId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
}

const ErpProjectSchema = new Schema<IErpProjectDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: "ErpFranchise", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "ErpClient", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    budget: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "In Progress",
        "Invoice Generated",
        "Payment Pending",
        "Payment Verified",
        "Completed",
      ],
      default: "Pending",
    },
    currentProgress: { type: Number, default: 0, min: 0, max: 100 },
    adminApproval: { type: Boolean, default: false },
    rejectionReason: { type: String },
  },
  { timestamps: true, collection: "erp_projects" }
);

const ErpProject: Model<IErpProjectDocument> =
  mongoose.models.ErpProject || mongoose.model<IErpProjectDocument>("ErpProject", ErpProjectSchema);

export default ErpProject;

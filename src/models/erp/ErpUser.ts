import mongoose, { Schema, Document, Model } from "mongoose";
import { IErpUser } from "@/types/erp";

export interface IErpUserDocument extends Omit<IErpUser, "_id" | "franchiseId">, Document {
  franchiseId?: mongoose.Types.ObjectId;
}

const ErpUserSchema = new Schema<IErpUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "FRANCHISE"], required: true },
    franchiseId: { type: Schema.Types.ObjectId, ref: "ErpFranchise", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "erp_users" }
);

const ErpUser: Model<IErpUserDocument> =
  mongoose.models.ErpUser || mongoose.model<IErpUserDocument>("ErpUser", ErpUserSchema);

export default ErpUser;

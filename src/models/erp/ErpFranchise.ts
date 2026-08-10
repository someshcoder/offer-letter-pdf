import mongoose, { Schema, Document, Model } from "mongoose";
import { IErpFranchise } from "@/types/erp";

export interface IErpFranchiseDocument extends Omit<IErpFranchise, "_id">, Document {}

const ErpFranchiseSchema = new Schema<IErpFranchiseDocument>(
  {
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    status: { type: String, enum: ["Active", "Disabled"], default: "Active" },
    commissionPercentage: { type: Number, default: 10, min: 0, max: 100 },
  },
  { timestamps: true, collection: "erp_franchises" }
);

const ErpFranchise: Model<IErpFranchiseDocument> =
  mongoose.models.ErpFranchise || mongoose.model<IErpFranchiseDocument>("ErpFranchise", ErpFranchiseSchema);

export default ErpFranchise;

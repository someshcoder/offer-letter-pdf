import mongoose, { Schema, Document, Model } from "mongoose";
import { IErpClient } from "@/types/erp";

export interface IErpClientDocument extends Omit<IErpClient, "_id" | "franchiseId">, Document {
  franchiseId: mongoose.Types.ObjectId;
}

const ErpClientSchema = new Schema<IErpClientDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: "ErpFranchise", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true, collection: "erp_clients" }
);

const ErpClient: Model<IErpClientDocument> =
  mongoose.models.ErpClient || mongoose.model<IErpClientDocument>("ErpClient", ErpClientSchema);

export default ErpClient;

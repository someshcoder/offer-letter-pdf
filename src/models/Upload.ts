import mongoose, { Schema, Document } from "mongoose";

export interface IUpload extends Document {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  data: Buffer;
  createdAt: Date;
}

const UploadSchema = new Schema<IUpload>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

const Upload = mongoose.models.Upload || mongoose.model<IUpload>("Upload", UploadSchema);

export default Upload;

import mongoose, { Schema } from "mongoose";

const FormSchema = new Schema(
  {
    refNo: { type: String, default: "" },
    offerAsOn: { type: String, default: "" },
    month: { type: String, default: "" },
    name: { type: String, default: "" },
    address: { type: String, default: "" },
    subject: { type: String, default: "" },
    salary: { type: String, default: "" },
    email: { type: String, default: "" },
    mobile: { type: String, default: "" },
  },
  { _id: false },
);

const SavedPdfSchema = new Schema(
  {
    title: { type: String, required: true },
    documentKind: {
      type: String,
      enum: ["offer", "internship", "other"],
      default: "offer",
    },
    form: { type: FormSchema, required: true },
    offsetX: { type: Number, default: 0 },
    offsetY: { type: Number, default: 0 },
    pdfBuffer: { type: Buffer, required: true },
    notifyEmail: { type: String, default: "" },
    lastMailTo: { type: String, default: "" },
    mailSentAt: { type: Date },
    mailError: { type: String, default: "" },
  },
  { timestamps: true },
);

const SavedPdf =
  mongoose.models.SavedPdf || mongoose.model("SavedPdf", SavedPdfSchema);

export default SavedPdf;

import mongoose, { Schema } from "mongoose";
import { ACCESS_ROLES, EMPLOYEE_FORM_ROLES, WORKING_TYPES } from "@/types/employee";

const UploadedFileSchema = new Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const EmployeeSchema = new Schema(
  {
    employeeName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    alternateNumber: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    designation: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: EMPLOYEE_FORM_ROLES,
      default: "Employee",
    },
    accessRole: {
      type: String,
      required: true,
      enum: ACCESS_ROLES,
      default: "Employee",
    },
    workingType: {
      type: String,
      required: true,
      enum: WORKING_TYPES,
      default: "Full Time",
    },
    address: {
      currentAddress: { type: String, required: true, trim: true },
      permanentAddress: { type: String, required: true, trim: true },
      workingLocation: { type: String, required: true, trim: true },
    },
    accountDetails: {
      accountHolderName: { type: String, required: true, trim: true },
      accountNumber: { type: String, required: true, trim: true },
      ifscCode: { type: String, required: true, trim: true, uppercase: true },
      bankName: { type: String, required: true, trim: true },
      upiId: { type: String, default: "", trim: true },
      upiHolderName: { type: String, default: "", trim: true },
    },
    documents: {
      aadharNumber: { type: String, required: true, trim: true },
      aadharFile: { type: UploadedFileSchema, required: false },
      panNumber: { type: String, default: "", trim: true, uppercase: true },
      panCardFile: { type: UploadedFileSchema, required: false },
      academicDocuments: { type: [UploadedFileSchema], default: [] },
      experienceLetter: { type: UploadedFileSchema, required: false },
      passportPhoto: { type: UploadedFileSchema, required: false },
      passbookFile: { type: UploadedFileSchema, required: false },
    },
  },
  { timestamps: true },
);

EmployeeSchema.index({ email: 1 }, { unique: true });
EmployeeSchema.index({ mobileNumber: 1 }, { unique: true });

const Employee =
  mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);

export default Employee;

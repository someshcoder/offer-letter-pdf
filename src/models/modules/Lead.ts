import mongoose, { Schema } from "mongoose";
import { actorFields, softDeleteFields } from "@/lib/modules/softDelete";

export const LEAD_STATUSES = ["Draft", "New", "Pending", "In Review", "Approved", "Rejected", "Allocated", "In Progress", "On Hold", "Completed", "Cancelled", "Closed", "Archived"] as const;
export const LEAD_SOURCES = ["Website", "Referral", "Social Media", "Cold Call", "Email", "Walk-in", "Other"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];

const LeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, required: true, trim: true, index: true },
    company: { type: String, trim: true, default: "" },
    source: { type: String, enum: LEAD_SOURCES, default: "Other", index: true },
    status: { type: String, enum: LEAD_STATUSES, default: "New", index: true },
    assignedTo: { type: String, default: "" },
    assignedToName: { type: String, default: "" },
    notes: { type: String, default: "" },
    expectedValue: { type: Number, default: 0 },
    nextFollowUpDate: { type: Date, default: null },
    convertedClientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    convertedAt: { type: Date, default: null },
    ...softDeleteFields,
    ...actorFields,
  },
  { timestamps: true },
);

LeadSchema.index({ name: "text", email: "text", phone: "text", company: "text" });
LeadSchema.index({ status: 1, createdAt: -1 });

const Lead = mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
export default Lead;

const LeadFollowUpSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    note: { type: String, required: true },
    followUpDate: { type: Date, default: Date.now },
    status: { type: String, enum: LEAD_STATUSES, default: "Contacted" },
    createdBy: { type: String, default: "" },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

export const LeadFollowUp =
  mongoose.models.LeadFollowUp || mongoose.model("LeadFollowUp", LeadFollowUpSchema);

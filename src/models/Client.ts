import mongoose, { Schema, Document } from 'mongoose';
import { IClient, IDomainDetails, ClientStatus, HostingProvider } from '../types/client';

export interface IClientDocument extends Omit<IClient, '_id'>, Document {}

const DomainDetailsSchema = new Schema<IDomainDetails>({
  domainName: { type: String, trim: true },
  businessName: { type: String, trim: true },
  category: { type: String, trim: true },
  renewalDate: { type: Date }, // Domain Expiry Date
  domainRegistrar: { type: String, trim: true }, // Domain Company
  hostingExpiryDate: { type: Date },
  hostingCompany: { type: String, trim: true },
  hostingProvider: { 
    type: String, 
    enum: ['Provider', 'Others'],
  },
  remarks: { type: String, trim: true },
}, { _id: false });


const ClientSchema = new Schema<IClientDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    domainDetails: {
      type: DomainDetailsSchema,
      default: {},
    },
    status: {
      type: String,
      enum: ['Work in Progress', 'Pending', 'Completed (Live)', 'Expired / Not Working'],
      default: 'Pending',
    },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    assignedStaffName: { type: String, trim: true, default: '' },
    customerNotes: { type: String, trim: true, default: '' },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

ClientSchema.index({ assignedStaffId: 1, createdAt: -1 });
ClientSchema.index({ name: 1 });
ClientSchema.index({ createdAt: -1 });
ClientSchema.index({ status: 1, createdAt: -1 });
ClientSchema.index({ mobileNumber: 1 });
ClientSchema.index({ "domainDetails.renewalDate": 1 });

const Client = mongoose.models.Client || mongoose.model<IClientDocument>('Client', ClientSchema);

export default Client;

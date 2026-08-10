export type ClientStatus = 'Work in Progress' | 'Pending' | 'Completed (Live)' | 'Expired / Not Working';
export type HostingProvider = 'Provider' | 'Others';

export interface IDomainDetails {
  domainName?: string | null;
  businessName?: string | null;
  category?: string | null;
  renewalDate?: string | null; // This is used for Domain Expiry
  domainRegistrar?: string | null; // This is used for Domain Company
  hostingExpiryDate?: string | null;
  hostingCompany?: string | null;
  hostingProvider?: HostingProvider | null;
  remarks?: string | null;
}


export interface IClient {
  _id?: string;
  name: string;
  mobileNumber: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  domainDetails?: IDomainDetails;
  status: ClientStatus;
  leadId?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  customerNotes?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// For creating new client forms
export type IClientFormData = Omit<IClient, '_id' | 'createdAt' | 'updatedAt'>;

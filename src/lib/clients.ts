import { z } from "zod";

export const CLIENT_STATUSES = [
  "Work in Progress",
  "Pending",
  "Completed (Live)",
  "Expired / Not Working",
] as const;

export const clientPayloadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  mobileNumber: z.string().trim().min(1, "Mobile number is required"),
  email: z.string().trim().email().optional().or(z.literal("")).nullable(),
  address: z.string().trim().optional().or(z.literal("")).nullable(),
  city: z.string().trim().optional().or(z.literal("")).nullable(),
  state: z.string().trim().optional().or(z.literal("")).nullable(),
  status: z.enum(CLIENT_STATUSES).default("Pending"),
  companyName: z.string().trim().optional().or(z.literal("")).nullable(),
  customerNotes: z.string().trim().optional().or(z.literal("")).nullable(),
  assignedStaffId: z.string().trim().optional().or(z.literal("")).nullable(),
  assignedStaffName: z.string().trim().optional().or(z.literal("")).nullable(),
});

export function mapClientPayload(data: z.infer<typeof clientPayloadSchema>) {
  const { companyName, ...rest } = data;
  return {
    ...rest,
    email: rest.email || "",
    address: rest.address || "",
    city: rest.city || "",
    state: rest.state || "",
    customerNotes: rest.customerNotes || "",
    assignedStaffId: rest.assignedStaffId || null,
    assignedStaffName: rest.assignedStaffName || "",
    domainDetails: companyName ? { businessName: companyName } : {},
  };
}

export function mapClientListItem(doc: Record<string, unknown>) {
  const domain = (doc.domainDetails || {}) as { businessName?: string };
  return {
    _id: String(doc._id),
    name: doc.name,
    mobileNumber: doc.mobileNumber,
    email: doc.email || "",
    city: doc.city || "",
    state: doc.state || "",
    address: doc.address || "",
    status: doc.status,
    companyName: domain.businessName || "",
    customerNotes: doc.customerNotes || "",
    assignedStaffId: doc.assignedStaffId ? String(doc.assignedStaffId) : "",
    assignedStaffName: doc.assignedStaffName || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapClientDetail(doc: Record<string, unknown>) {
  const domain = (doc.domainDetails || {}) as { businessName?: string };
  return {
    ...mapClientListItem(doc),
    assignedStaffId: doc.assignedStaffId ? String(doc.assignedStaffId) : "",
    domainDetails: doc.domainDetails,
    companyName: domain.businessName || "",
  };
}

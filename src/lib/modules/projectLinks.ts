import Domain, { DomainHistory } from "@/models/modules/Domain";
import MarketingPayment from "@/models/modules/MarketingPayment";
import MaintenanceService, { ServiceHistory } from "@/models/modules/MaintenanceService";

function parseDate(value: unknown): Date | null {
  if (value === "" || value === null || value === undefined) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function calcDue(total: number, paid: number, discount: number) {
  return Math.max(0, total - discount - paid);
}

function calcPaymentStatus(total: number, paid: number, discount: number) {
  const due = calcDue(total, paid, discount);
  if (due <= 0) return "Paid";
  if (paid > 0) return "Partial";
  return "Pending";
}

type SyncOptions = {
  projectId: string;
  clientId: string;
  projectName: string;
  body: Record<string, unknown>;
  userId: string;
  domainId?: string;
  paymentId?: string;
  maintenanceId?: string;
};

export async function syncProjectLinks({
  projectId,
  clientId,
  projectName,
  body,
  userId,
  domainId,
  paymentId,
  maintenanceId,
}: SyncOptions) {
  const domainName = String(body.domainName || "").trim();
  if (domainName) {
    const domainPayload = {
      clientId,
      projectId,
      domainName,
      registrar: String(body.domainRegistrar || "").trim(),
      expiryDate: parseDate(body.domainExpiryDate),
      hostingProvider: String(body.hostingProvider || "").trim(),
      updatedBy: userId,
    };
    if (domainId) {
      await Domain.findOneAndUpdate({ _id: domainId, deletedAt: null }, domainPayload);
    } else {
      const domain = await Domain.create({
        ...domainPayload,
        createdBy: userId,
      });
      await DomainHistory.create({
        domainId: domain._id,
        action: "created",
        details: `Linked to project: ${projectName}`,
        changedBy: userId,
      });
    }
  }

  const totalAmount = Number(body.paymentTotalAmount || body.totalAmount || 0);
  if (totalAmount > 0) {
    const paidAmount = Number(body.paidAmount || 0);
    const discount = Number(body.discount || 0);
    const dueAmount = calcDue(totalAmount, paidAmount, discount);
    const paymentPayload = {
      clientId,
      projectId,
      invoiceNumber: String(body.invoiceNumber || "").trim(),
      paymentType: String(body.paymentType || "One Time"),
      totalAmount,
      paidAmount,
      dueAmount,
      gstPercent: Number(body.gstPercent || 18),
      discount,
      status: calcPaymentStatus(totalAmount, paidAmount, discount),
      dueDate: parseDate(body.paymentDueDate),
      notes: String(body.paymentNotes || "").trim(),
      updatedBy: userId,
    };
    if (paymentId) {
      await MarketingPayment.findOneAndUpdate({ _id: paymentId, deletedAt: null }, paymentPayload);
    } else {
      await MarketingPayment.create({
        ...paymentPayload,
        createdBy: userId,
      });
    }
  }

  const maintenanceType = String(body.maintenanceType || "No Maintenance");
  if (maintenanceType && maintenanceType !== "No Maintenance") {
    const maintenancePayload = {
      clientId,
      projectId,
      serviceType: maintenanceType,
      title: String(body.maintenanceTitle || `${projectName} Maintenance`),
      description: String(body.maintenanceDescription || "").trim(),
      status: "Active",
      startDate: parseDate(body.maintenanceStartDate),
      expiryDate: parseDate(body.maintenanceExpiryDate),
      renewalDate: parseDate(body.maintenanceRenewalDate),
      updatedBy: userId,
    };
    if (maintenanceId) {
      await MaintenanceService.findOneAndUpdate({ _id: maintenanceId, deletedAt: null }, maintenancePayload);
    } else {
      const service = await MaintenanceService.create({
        ...maintenancePayload,
        createdBy: userId,
      });
      await ServiceHistory.create({
        serviceId: service._id,
        action: "created",
        details: `Linked to project: ${projectName}`,
        changedBy: userId,
      });
    }
  } else if (maintenanceId) {
    await MaintenanceService.findOneAndUpdate(
      { _id: maintenanceId, deletedAt: null },
      { deletedAt: new Date(), deletedBy: userId, isActive: false },
    );
  }
}


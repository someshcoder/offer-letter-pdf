import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { paymentSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import Client from "@/models/Client";
import MarketingPayment, { PaymentHistory } from "@/models/modules/MarketingPayment";

function calcDue(total: number, paid: number, discount: number) {
  return Math.max(0, total - discount - paid);
}

function calcStatus(total: number, paid: number, discount: number) {
  const due = calcDue(total, paid, discount);
  if (due <= 0) return "Paid";
  if (paid > 0) return "Partial";
  return "Pending";
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("sales");
  if ("error" in auth) return auth.error;

  try {
    const parsed = paymentSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid payment data", 400);

    await connectDB();

    // Verify ownership for employees (assigned staff)
    if (auth.user.role === "Employee") {
      const client = await Client.findOne({
        _id: parsed.data.clientId,
        assignedStaffId: auth.user.userId,
        deletedAt: null,
      });
      if (!client) {
        return jsonError("Unauthorized to record payment for this customer", 403);
      }
    } else {
      const client = await Client.findOne({ _id: parsed.data.clientId, deletedAt: null });
      if (!client) return jsonError("Customer not found", 404);
    }

    const paid = parsed.data.paidAmount || 0;
    const discount = parsed.data.discount || 0;
    const dueAmount = calcDue(parsed.data.totalAmount, paid, discount);

    const item = await MarketingPayment.create({
      ...parsed.data,
      paidAmount: paid,
      discount,
      dueAmount,
      status: calcStatus(parsed.data.totalAmount, paid, discount),
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });

    if (paid > 0) {
      await PaymentHistory.create({
        paymentId: item._id,
        amount: paid,
        paymentMode: "Sales Collection",
        notes: parsed.data.notes || "Collected by Sales",
        recordedBy: auth.user.userId,
      });
    }

    if (dueAmount > 0) {
      await createNotification({
        title: "Pending Payment",
        message: `Payment due: ₹${dueAmount}`,
        type: "pending_payment",
        link: "/payments",
      });
    }

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "create",
      module: "payment",
      entityId: String(item._id),
      details: "Payment record created by Sales",
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

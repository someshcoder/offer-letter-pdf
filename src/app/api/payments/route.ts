import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import {
  parseListQuery,
  buildSoftDeleteFilter,
  buildSort,
  paginated,
  skip,
} from "@/lib/modules/query";
import { paymentSchema, recordPaymentSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import {
  employeeOwnsClient,
  getEmployeeClientIds,
} from "@/lib/modules/customerOwnership";
import Client from "@/models/Client";
import Project from "@/models/modules/Project";
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

async function restrictClientIdsForRole(
  role: string,
  userId: string,
  requestedClientId?: string | null,
): Promise<{ clientIds?: string[] } | { error: string; status: number }> {
  if (role !== "Employee") {
    return requestedClientId ? { clientIds: [requestedClientId] } : {};
  }

  const owned = await getEmployeeClientIds(userId);
  if (owned.length === 0) {
    return { clientIds: [] };
  }

  if (requestedClientId) {
    if (!owned.includes(requestedClientId)) {
      return { error: "You can only access payments for your assigned customers", status: 403 };
    }
    return { clientIds: [requestedClientId] };
  }

  return { clientIds: owned };
}

export async function GET(request: Request) {
  const auth = await requireModuleAuth("payment");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");
    const projectId = url.searchParams.get("projectId");

    const scope = await restrictClientIdsForRole(auth.user.role, auth.user.userId, clientId);
    if ("error" in scope) return jsonError(scope.error, scope.status);

    const filter: Record<string, unknown> = {
      ...buildSoftDeleteFilter(q.includeDeleted || false),
      ...(q.status && q.status !== "All" ? { status: q.status } : {}),
      ...(projectId ? { projectId } : {}),
    };

    if (scope.clientIds) {
      filter.clientId = { $in: scope.clientIds };
    }

    const total = await MarketingPayment.countDocuments(filter);
    const items = await MarketingPayment.find(filter)
      .sort(buildSort("createdAt", "desc"))
      .skip(skip(q.page, q.limit))
      .limit(q.limit)
      .lean();

    const clientIds = [...new Set(items.map((i) => String(i.clientId)).filter(Boolean))];
    const projectIds = [...new Set(items.map((i) => String(i.projectId)).filter(Boolean))];
    const [clients, projects] = await Promise.all([
      clientIds.length ? Client.find({ _id: { $in: clientIds } }).select("name").lean() : [],
      projectIds.length ? Project.find({ _id: { $in: projectIds } }).select("name").lean() : [],
    ]);
    const clientNames = Object.fromEntries(clients.map((c) => [String(c._id), c.name]));
    const projectNames = Object.fromEntries(projects.map((p) => [String(p._id), p.name]));

    const enriched = items.map((item) => ({
      ...item,
      clientName: clientNames[String(item.clientId)] || "",
      projectName: projectNames[String(item.projectId)] || "",
    }));

    return NextResponse.json(paginated(mapDocs(enriched), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("payment");
  if ("error" in auth) return auth.error;
  try {
    const parsed = paymentSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid payment data", 400);
    await connectDB();

    if (auth.user.role === "Employee") {
      const owns = await employeeOwnsClient(auth.user.userId, parsed.data.clientId);
      if (!owns) {
        return jsonError("You can only record payments for your assigned customers", 403);
      }
    } else {
      const client = await Client.findOne({ _id: parsed.data.clientId, deletedAt: null }).select("_id");
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
        notes: parsed.data.notes || "Initial amount received",
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
      details: "Payment record created",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(
      { item: { ...item.toObject(), _id: String(item._id) } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireModuleAuth("payment");
  if ("error" in auth) return auth.error;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return jsonError("Payment id required", 400);
    const parsed = recordPaymentSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid payment record", 400);
    await connectDB();
    const payment = await MarketingPayment.findOne({ _id: id, deletedAt: null });
    if (!payment) return jsonError("Payment not found", 404);

    if (auth.user.role === "Employee") {
      const owns = await employeeOwnsClient(auth.user.userId, String(payment.clientId));
      if (!owns) {
        return jsonError("You can only update payments for your assigned customers", 403);
      }
    }

    await PaymentHistory.create({
      paymentId: id,
      amount: parsed.data.amount,
      paymentMode: parsed.data.paymentMode,
      transactionRef: parsed.data.transactionRef,
      receiptUrl: parsed.data.receiptUrl,
      notes: parsed.data.notes,
      recordedBy: auth.user.userId,
    });
    payment.paidAmount += parsed.data.amount;
    payment.dueAmount = calcDue(payment.totalAmount, payment.paidAmount, payment.discount);
    payment.status = calcStatus(payment.totalAmount, payment.paidAmount, payment.discount);
    payment.updatedBy = auth.user.userId;
    await payment.save();
    return NextResponse.json({ item: { ...payment.toObject(), _id: String(payment._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

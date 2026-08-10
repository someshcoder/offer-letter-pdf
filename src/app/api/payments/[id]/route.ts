import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { paymentSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import { employeeOwnsClient } from "@/lib/modules/customerOwnership";
import MarketingPayment from "@/models/modules/MarketingPayment";

export async function PATCH(request: Request, ctx: RouteContext<"/api/payments/[id]">) {
  const auth = await requireModuleAuth("payment");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await ctx.params;
    const parsed = paymentSchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid update data", 400);
    await connectDB();

    const existing = await MarketingPayment.findOne({ _id: id, deletedAt: null });
    if (!existing) return jsonError("Not found", 404);

    if (auth.user.role === "Employee") {
      const owns = await employeeOwnsClient(auth.user.userId, String(existing.clientId));
      if (!owns) {
        return jsonError("You can only update payments for your assigned customers", 403);
      }
      if (parsed.data.clientId && parsed.data.clientId !== String(existing.clientId)) {
        const ownsNext = await employeeOwnsClient(auth.user.userId, parsed.data.clientId);
        if (!ownsNext) {
          return jsonError("You can only assign payments to your assigned customers", 403);
        }
      }
    }

    const next = {
      ...parsed.data,
      updatedBy: auth.user.userId,
    } as Record<string, unknown>;

    if (
      parsed.data.totalAmount !== undefined ||
      parsed.data.paidAmount !== undefined ||
      parsed.data.discount !== undefined
    ) {
      const total = Number(parsed.data.totalAmount ?? existing.totalAmount);
      const paid = Number(parsed.data.paidAmount ?? existing.paidAmount);
      const discount = Number(parsed.data.discount ?? existing.discount ?? 0);
      const due = Math.max(0, total - discount - paid);
      next.dueAmount = due;
      next.status = due <= 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";
    }

    const item = await MarketingPayment.findOneAndUpdate(
      { _id: id, deletedAt: null },
      next,
      { new: true, runValidators: true },
    ).lean();
    if (!item) return jsonError("Not found", 404);

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "update",
      module: "payment",
      entityId: id,
      details: "Payment updated",
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ item: { ...item, _id: String(item._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/payments/[id]">) {
  const auth = await requireModuleAuth("payment");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await ctx.params;
    await connectDB();

    const existing = await MarketingPayment.findOne({ _id: id, deletedAt: null });
    if (!existing) return jsonError("Not found", 404);

    if (auth.user.role === "Employee") {
      const owns = await employeeOwnsClient(auth.user.userId, String(existing.clientId));
      if (!owns) {
        return jsonError("You can only delete payments for your assigned customers", 403);
      }
    }

    await MarketingPayment.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), deletedBy: auth.user.userId, isActive: false },
      { new: true },
    );

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "delete",
      module: "payment",
      entityId: id,
      details: "Payment soft deleted",
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}

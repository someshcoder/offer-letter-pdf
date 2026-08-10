import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireAuth } from "@/lib/apiAuth";
import { logAudit, getClientIp } from "@/lib/audit";
import SalesPrize, { PRIZE_METRICS, PRIZE_PERIODS } from "@/models/modules/SalesPrize";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  reward: z.string().trim().min(1).optional(),
  metric: z.enum(PRIZE_METRICS).optional(),
  targetValue: z.coerce.number().min(0).optional(),
  period: z.enum(PRIZE_PERIODS).optional(),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/sales/prizes/[id]">) {
  const auth = await requireAuth(["Admin", "HR"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid prize data", 400);

    await connectDB();
    const item = await SalesPrize.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { ...parsed.data, updatedBy: auth.user.userId },
      { new: true, runValidators: true },
    ).lean();

    if (!item) return jsonError("Prize not found", 404);

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "update",
      module: "sales",
      entityId: id,
      details: `Sales prize updated: ${item.title}`,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ item: { ...item, _id: String(item._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/sales/prizes/[id]">) {
  const auth = await requireAuth(["Admin", "HR"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    await connectDB();
    const item = await SalesPrize.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), deletedBy: auth.user.userId, isActive: false },
      { new: true },
    ).lean();

    if (!item) return jsonError("Prize not found", 404);

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "delete",
      module: "sales",
      entityId: id,
      details: `Sales prize deleted: ${item.title}`,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { staffAllocationSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import StaffAllocation, { StaffAllocationHistory } from "@/models/modules/StaffAllocation";

export async function PATCH(request: Request, ctx: RouteContext<"/api/staff-allocations/[id]">) {
  const auth = await requireModuleAuth("staff_allocation");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = staffAllocationSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError("Invalid update data", 400);

    await connectDB();
    const item = await StaffAllocation.findByIdAndUpdate(
      id,
      { ...parsed.data, updatedBy: auth.user.userId },
      { new: true },
    ).lean();
    if (!item) return jsonError("Allocation not found", 404);

    await StaffAllocationHistory.create({
      allocationId: id,
      employeeId: item.employeeId,
      projectId: item.projectId,
      action: "updated",
      details: "Allocation updated",
      changedBy: auth.user.userId,
    });

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "update",
      module: "staff_allocation",
      entityId: id,
      details: "Staff allocation updated",
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ item: { ...item, _id: String(item._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/staff-allocations/[id]">) {
  const auth = await requireModuleAuth("staff_allocation");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    await connectDB();
    const item = await StaffAllocation.findByIdAndUpdate(
      id,
      { isActive: false, endDate: new Date(), updatedBy: auth.user.userId },
      { new: true },
    ).lean();
    if (!item) return jsonError("Allocation not found", 404);

    await StaffAllocationHistory.create({
      allocationId: id,
      employeeId: item.employeeId,
      projectId: item.projectId,
      action: "removed",
      details: "Staff removed from project",
      changedBy: auth.user.userId,
    });

    return NextResponse.json({ message: "Allocation removed" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(_req: Request, ctx: RouteContext<"/api/staff-allocations/[id]">) {
  const auth = await requireModuleAuth("staff_allocation");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    await connectDB();
    const history = await StaffAllocationHistory.find({ allocationId: id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      items: history.map((h) => ({ ...h, _id: String(h._id) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { maintenanceSchema } from "@/lib/modules/schemas";
import MaintenanceService, { ServiceHistory } from "@/models/modules/MaintenanceService";

export async function PATCH(request: Request, ctx: RouteContext<"/api/maintenance/[id]">) {
  const auth = await requireModuleAuth("maintenance");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await ctx.params;
    const parsed = maintenanceSchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid update", 400);
    await connectDB();
    const item = await MaintenanceService.findOneAndUpdate({ _id: id, deletedAt: null }, { ...parsed.data, updatedBy: auth.user.userId }, { new: true }).lean();
    if (!item) return jsonError("Not found", 404);
    await ServiceHistory.create({ serviceId: id, action: "updated", details: "Service updated", changedBy: auth.user.userId });
    return NextResponse.json({ item: { ...item, _id: String(item._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/maintenance/[id]">) {
  const auth = await requireModuleAuth("maintenance");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await ctx.params;
    await connectDB();
    await MaintenanceService.findOneAndUpdate({ _id: id }, { deletedAt: new Date(), isActive: false });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}

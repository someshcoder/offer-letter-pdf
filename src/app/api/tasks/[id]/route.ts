import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { taskSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import Task, { TaskHistory } from "@/models/modules/Task";

export async function PATCH(request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const auth = await requireModuleAuth("task");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await ctx.params;
    const parsed = taskSchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid update", 400);
    await connectDB();
    const updates = { ...parsed.data, updatedBy: auth.user.userId } as Record<string, unknown>;
    if (parsed.data.status === "Completed") {
      updates.completedAt = new Date();
      updates.progress = 100;
    }
    const item = await Task.findOneAndUpdate({ _id: id, deletedAt: null }, updates, { new: true }).lean();
    if (!item) return jsonError("Not found", 404);
    await TaskHistory.create({ taskId: id, action: "updated", details: "Task updated", changedBy: auth.user.userId });
    await logAudit({ userId: auth.user.userId, userEmail: auth.user.email, action: "update", module: "task", entityId: id, details: "Task updated", ipAddress: getClientIp(request) });
    return NextResponse.json({ item: { ...item, _id: String(item._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const auth = await requireModuleAuth("task");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await ctx.params;
    await connectDB();
    await Task.findOneAndUpdate({ _id: id }, { deletedAt: new Date(), deletedBy: auth.user.userId, isActive: false });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}

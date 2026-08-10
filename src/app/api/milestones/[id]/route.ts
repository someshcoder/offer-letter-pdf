import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { milestoneSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import ProjectMilestone, { MilestoneHistory } from "@/models/modules/ProjectMilestone";
import Project from "@/models/modules/Project";

export async function PATCH(request: Request, ctx: RouteContext<"/api/milestones/[id]">) {
  const auth = await requireModuleAuth("milestone");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = milestoneSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError("Invalid update data", 400);

    await connectDB();
    const updates = { ...parsed.data, updatedBy: auth.user.userId } as Record<string, unknown>;
    if (parsed.data.status === "Completed") {
      updates.completedAt = new Date();
      updates.progress = 100;
    }

    const item = await ProjectMilestone.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updates,
      { new: true, runValidators: true },
    ).lean();
    if (!item) return jsonError("Milestone not found", 404);

    await MilestoneHistory.create({
      milestoneId: id,
      action: "updated",
      progress: item.progress,
      details: `Milestone updated: ${item.title}`,
      changedBy: auth.user.userId,
    });

    const milestones = await ProjectMilestone.find({ projectId: item.projectId, deletedAt: null });
    if (milestones.length > 0) {
      const avgProgress = milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length;
      await Project.findByIdAndUpdate(item.projectId, {
        completionPercent: Math.round(avgProgress),
      });
    }

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "update",
      module: "milestone",
      entityId: id,
      details: `Milestone updated: ${item.title}`,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ item: { ...item, _id: String(item._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/milestones/[id]">) {
  const auth = await requireModuleAuth("milestone");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    await connectDB();
    const item = await ProjectMilestone.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), deletedBy: auth.user.userId, isActive: false },
      { new: true },
    ).lean();
    if (!item) return jsonError("Milestone not found", 404);
    return NextResponse.json({ message: "Milestone deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}

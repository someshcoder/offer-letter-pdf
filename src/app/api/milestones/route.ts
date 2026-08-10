import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import {
  parseListQuery,
  buildSoftDeleteFilter,
  buildSearchFilter,
  buildSort,
  paginated,
  skip,
} from "@/lib/modules/query";
import { milestoneSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import ProjectMilestone, { MilestoneHistory } from "@/models/modules/ProjectMilestone";
import Project from "@/models/modules/Project";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("milestone");
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    const filter: Record<string, unknown> = {
      ...buildSoftDeleteFilter(q.includeDeleted || false),
      ...(projectId ? { projectId } : {}),
      ...(q.status && q.status !== "All" ? { status: q.status } : {}),
      ...buildSearchFilter(q.search || "", ["title", "description"]),
    };

    const total = await ProjectMilestone.countDocuments(filter);
    const items = await ProjectMilestone.find(filter)
      .sort(buildSort(q.sortBy || "deadline", q.sortOrder || "asc"))
      .skip(skip(q.page, q.limit))
      .limit(q.limit)
      .lean();

    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("milestone");
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = milestoneSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid milestone data", 400);

    await connectDB();
    const item = await ProjectMilestone.create({
      ...parsed.data,
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });

    await MilestoneHistory.create({
      milestoneId: item._id,
      action: "created",
      progress: item.progress,
      details: `Milestone created: ${item.title}`,
      changedBy: auth.user.userId,
    });

    const milestones = await ProjectMilestone.find({ projectId: parsed.data.projectId, deletedAt: null });
    if (milestones.length > 0) {
      const avgProgress = milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length;
      await Project.findByIdAndUpdate(parsed.data.projectId, {
        completionPercent: Math.round(avgProgress),
        updatedBy: auth.user.userId,
      });
    }

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "create",
      module: "milestone",
      entityId: String(item._id),
      details: `Milestone created: ${item.title}`,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

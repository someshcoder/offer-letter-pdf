import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSearchFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { staffAllocationSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import StaffAllocation, { StaffAllocationHistory } from "@/models/modules/StaffAllocation";
import Project from "@/models/modules/Project";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("staff_allocation");
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const employeeId = url.searchParams.get("employeeId");

    const filter: Record<string, unknown> = {
      isActive: true,
      ...(projectId ? { projectId } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...buildSearchFilter(q.search || "", ["employeeName", "projectName", "role"]),
    };

    const total = await StaffAllocation.countDocuments(filter);
    const items = await StaffAllocation.find(filter)
      .sort(buildSort(q.sortBy || "createdAt", q.sortOrder || "desc"))
      .skip(skip(q.page, q.limit))
      .limit(q.limit)
      .lean();

    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("staff_allocation");
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = staffAllocationSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid allocation data", 400);

    await connectDB();
    const project = await Project.findById(parsed.data.projectId);
    if (!project) return jsonError("Project not found", 404);

    const item = await StaffAllocation.create({
      ...parsed.data,
      projectName: parsed.data.projectName || project.name,
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });

    await StaffAllocationHistory.create({
      allocationId: item._id,
      employeeId: parsed.data.employeeId,
      projectId: parsed.data.projectId,
      action: "assigned",
      details: `${parsed.data.employeeName} assigned to ${project.name}`,
      changedBy: auth.user.userId,
    });

    const staffIds = new Set((project.assignedStaffIds || []).map(String));
    staffIds.add(parsed.data.employeeId);
    project.assignedStaffIds = Array.from(staffIds);
    if (project.status === "Pending Allocation" || project.status === "Draft") {
      project.status = "Staff Assigned";
    }
    project.updatedBy = auth.user.userId;
    await project.save();

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "assign",
      module: "staff_allocation",
      entityId: String(item._id),
      details: `Staff ${parsed.data.employeeName} allocated to ${project.name}`,
      ipAddress: getClientIp(request),
    });

    await createNotification({
      title: "Staff Allocated",
      message: `${parsed.data.employeeName} assigned to project ${project.name}`,
      type: "staff_allocation",
      link: "/staff-allocation",
      entityModule: "staff_allocation",
      entityId: String(item._id),
    });

    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

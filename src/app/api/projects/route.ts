import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireAuth } from "@/lib/apiAuth";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import {
  parseListQuery,
  buildSoftDeleteFilter,
  buildSearchFilter,
  buildSort,
  paginated,
  skip,
} from "@/lib/modules/query";
import { projectCreateSchema } from "@/lib/modules/schemas";
import { syncProjectLinks } from "@/lib/modules/projectLinks";
import { logAudit, getClientIp } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import {
  employeeOwnsClient,
  getEmployeeClientIds,
} from "@/lib/modules/customerOwnership";
import Project from "@/models/modules/Project";
import { CustomerActivity } from "@/models/modules/CustomerActivity";

export async function GET(request: Request) {
  // Employees need read-only project lookup for payment auto-fill on their customers
  const auth = await requireAuth(["Admin", "HR", "TL", "Employee"]);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");

    const filter: Record<string, unknown> = {
      ...buildSoftDeleteFilter(q.includeDeleted || false),
      ...(q.status && q.status !== "All" ? { status: q.status } : {}),
      ...buildSearchFilter(q.search || "", ["name", "description"]),
    };

    if (auth.user.role === "Employee") {
      const owned = await getEmployeeClientIds(auth.user.userId);
      if (clientId) {
        if (!owned.includes(clientId) && !(await employeeOwnsClient(auth.user.userId, clientId))) {
          return jsonError("You can only view projects for your assigned customers", 403);
        }
        filter.clientId = clientId;
      } else {
        filter.clientId = { $in: owned };
      }
    } else if (clientId) {
      filter.clientId = clientId;
    }

    const total = await Project.countDocuments(filter);
    const items = await Project.find(filter)
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
  const auth = await requireModuleAuth("project");
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = projectCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid project data", 400);

    await connectDB();
    const item = await Project.create({
      ...parsed.data,
      status: parsed.data.status || "Pending Allocation",
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });

    await CustomerActivity.create({
      clientId: parsed.data.clientId,
      action: "project_created",
      details: `Project created: ${item.name}`,
      module: "project",
      entityId: String(item._id),
      changedBy: auth.user.userId,
    });

    await syncProjectLinks({
      projectId: String(item._id),
      clientId: parsed.data.clientId,
      projectName: item.name,
      body,
      userId: auth.user.userId,
    });

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "create",
      module: "project",
      entityId: String(item._id),
      details: `Project created: ${item.name}`,
      ipAddress: getClientIp(request),
    });

    await createNotification({
      title: "New Project Created",
      message: `Project "${item.name}" created and pending allocation`,
      type: "staff_allocation",
      link: "/projects",
      entityModule: "project",
      entityId: String(item._id),
    });

    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

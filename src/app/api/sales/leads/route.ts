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
import { leadCreateSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import Lead from "@/models/modules/Lead";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("sales");
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const filter: Record<string, unknown> = {
      ...buildSoftDeleteFilter(q.includeDeleted || false),
      ...(q.status && q.status !== "All" ? { status: q.status } : {}),
      ...buildSearchFilter(q.search || "", ["name", "email", "phone", "company"]),
    };

    if (auth.user.role === "Employee") {
      filter.assignedTo = auth.user.userId;
    } else {
      const url = new URL(request.url);
      const requestedStaffId = url.searchParams.get("assignedTo");
      if (requestedStaffId) {
        filter.assignedTo = requestedStaffId;
      }
    }
    const total = await Lead.countDocuments(filter);
    const items = await Lead.find(filter)
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
  const auth = await requireModuleAuth("sales");
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = leadCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid lead data", 400);

    await connectDB();
    
    // Assign to the creator by default if they are an employee, unless specified
    let assignedTo = parsed.data.assignedTo || "";
    if (!assignedTo && auth.user.role === "Employee") {
      assignedTo = auth.user.userId;
    }

    const item = await Lead.create({
      ...parsed.data,
      assignedTo,
      assignedToName: parsed.data.assignedToName || (assignedTo === auth.user.userId ? auth.user.name : ""),
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "create",
      module: "sales",
      entityId: String(item._id),
      details: `Lead created: ${item.name}`,
      ipAddress: getClientIp(request),
    });

    await createNotification({
      title: "New Sales Lead",
      message: `New lead registered: ${item.name}`,
      type: "general",
      link: "/sales/leads",
      entityModule: "sales",
      entityId: String(item._id),
    });

    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

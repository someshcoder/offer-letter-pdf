import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { maintenanceSchema } from "@/lib/modules/schemas";
import { createNotification } from "@/lib/notifications";
import MaintenanceService, { ServiceHistory } from "@/models/modules/MaintenanceService";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("maintenance");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");
    const projectId = url.searchParams.get("projectId");
    const filter: Record<string, unknown> = {
      ...buildSoftDeleteFilter(q.includeDeleted || false),
      ...(q.status && q.status !== "All" ? { status: q.status } : {}),
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
    };
    const total = await MaintenanceService.countDocuments(filter);
    const items = await MaintenanceService.find(filter).sort(buildSort("createdAt", "desc")).skip(skip(q.page, q.limit)).limit(q.limit).lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("maintenance");
  if ("error" in auth) return auth.error;
  try {
    const parsed = maintenanceSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid maintenance data", 400);
    await connectDB();
    const item = await MaintenanceService.create({ ...parsed.data, createdBy: auth.user.userId, updatedBy: auth.user.userId });
    await ServiceHistory.create({ serviceId: item._id, action: "created", details: item.title, changedBy: auth.user.userId });
    await createNotification({ title: "Maintenance Request", message: item.title, type: "maintenance_request", link: "/maintenance" });
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

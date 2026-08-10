import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { domainSchema } from "@/lib/modules/schemas";
import { createNotification } from "@/lib/notifications";
import Domain, { DomainHistory } from "@/models/modules/Domain";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("domain");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");
    const projectId = url.searchParams.get("projectId");
    const filter = {
      ...buildSoftDeleteFilter(q.includeDeleted || false),
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
    };
    const total = await Domain.countDocuments(filter);
    const items = await Domain.find(filter).sort(buildSort("expiryDate", "asc")).skip(skip(q.page, q.limit)).limit(q.limit).lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("domain");
  if ("error" in auth) return auth.error;
  try {
    const parsed = domainSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid domain data", 400);
    await connectDB();
    const item = await Domain.create({ ...parsed.data, createdBy: auth.user.userId, updatedBy: auth.user.userId });
    await DomainHistory.create({ domainId: item._id, action: "created", details: item.domainName, changedBy: auth.user.userId });
    if (item.expiryDate) {
      await createNotification({ title: "Domain Registered", message: `${item.domainName} expires ${new Date(item.expiryDate).toLocaleDateString()}`, type: "domain_expiry", link: "/domains" });
    }
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

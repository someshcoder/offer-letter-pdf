import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { assetSchema } from "@/lib/modules/schemas";
import CompanyAsset, { AssetHistory } from "@/models/modules/CompanyAsset";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("asset");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const filter: Record<string, unknown> = { ...buildSoftDeleteFilter(q.includeDeleted || false), ...(q.status && q.status !== "All" ? { status: q.status } : {}) };
    const total = await CompanyAsset.countDocuments(filter);
    const items = await CompanyAsset.find(filter).sort(buildSort("createdAt", "desc")).skip(skip(q.page, q.limit)).limit(q.limit).lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("asset");
  if ("error" in auth) return auth.error;
  try {
    const parsed = assetSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid asset data", 400);
    await connectDB();
    const item = await CompanyAsset.create({ ...parsed.data, createdBy: auth.user.userId, updatedBy: auth.user.userId });
    await AssetHistory.create({ assetId: item._id, action: "created", details: item.name, changedBy: auth.user.userId });
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

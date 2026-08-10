import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { purchaseSchema, approvalSchema } from "@/lib/modules/schemas";
import PurchaseRequest from "@/models/modules/PurchaseRequest";
import CompanyAsset from "@/models/modules/CompanyAsset";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("purchase");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const filter: Record<string, unknown> = { ...buildSoftDeleteFilter(q.includeDeleted || false), ...(q.status && q.status !== "All" ? { status: q.status } : {}) };
    const total = await PurchaseRequest.countDocuments(filter);
    const items = await PurchaseRequest.find(filter).sort(buildSort("createdAt", "desc")).skip(skip(q.page, q.limit)).limit(q.limit).lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("purchase");
  if ("error" in auth) return auth.error;
  try {
    const parsed = purchaseSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid purchase data", 400);
    await connectDB();
    const qty = parsed.data.quantity || 1;
    const totalCost = qty * parsed.data.unitCost;
    const item = await PurchaseRequest.create({ ...parsed.data, quantity: qty, totalCost, createdBy: auth.user.userId, updatedBy: auth.user.userId });
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireModuleAuth("purchase");
  if ("error" in auth) return auth.error;
  if (auth.user.role !== "Admin" && auth.user.role !== "HR") return jsonError("Forbidden", 403);
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action");
    if (!id) return jsonError("Id required", 400);
    await connectDB();
    const purchase = await PurchaseRequest.findOne({ _id: id, deletedAt: null });
    if (!purchase) return jsonError("Not found", 404);

    if (action === "approve") {
      const parsed = approvalSchema.safeParse(await request.json());
      if (!parsed.success) return jsonError("Invalid approval", 400);
      purchase.status = parsed.data.status === "Approved" ? "Approved" : "Rejected";
      purchase.approvedBy = auth.user.userId;
      purchase.approvedAt = new Date();
      await purchase.save();
      return NextResponse.json({ item: { ...purchase.toObject(), _id: String(purchase._id) } });
    }

    if (action === "create-asset") {
      const asset = await CompanyAsset.create({
        assetType: purchase.assetType || "Other",
        name: purchase.title,
        purchaseCost: purchase.totalCost,
        purchaseDate: new Date(),
        status: "Available",
        purchaseRequestId: purchase._id,
        createdBy: auth.user.userId,
        updatedBy: auth.user.userId,
      });
      purchase.assetCreated = true;
      purchase.assetId = asset._id;
      purchase.status = "Received";
      await purchase.save();
      return NextResponse.json({ asset: { ...asset.toObject(), _id: String(asset._id) } });
    }

    return jsonError("Invalid action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}

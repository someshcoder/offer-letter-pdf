import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { serviceChargeSchema } from "@/lib/modules/schemas";
import ServiceCharge from "@/models/modules/ServiceCharge";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("service_charge");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const filter = buildSoftDeleteFilter(q.includeDeleted || false);
    const total = await ServiceCharge.countDocuments(filter);
    const items = await ServiceCharge.find(filter).sort(buildSort("createdAt", "desc")).skip(skip(q.page, q.limit)).limit(q.limit).lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("service_charge");
  if ("error" in auth) return auth.error;
  try {
    const parsed = serviceChargeSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid service charge data", 400);
    await connectDB();
    const gst = parsed.data.gstPercent ?? 18;
    const discount = parsed.data.discount ?? 0;
    const totalAmount = parsed.data.amount + (parsed.data.amount * gst) / 100 - discount;
    const item = await ServiceCharge.create({ ...parsed.data, gstPercent: gst, discount, totalAmount, createdBy: auth.user.userId, updatedBy: auth.user.userId });
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

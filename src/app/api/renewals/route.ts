import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { renewalSchema } from "@/lib/modules/schemas";
import { createNotification } from "@/lib/notifications";
import Renewal, { RenewalHistory } from "@/models/modules/Renewal";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("renewal");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const filter: Record<string, unknown> = { ...buildSoftDeleteFilter(q.includeDeleted || false), ...(q.status && q.status !== "All" ? { paymentStatus: q.status } : {}) };
    const total = await Renewal.countDocuments(filter);
    const items = await Renewal.find(filter).sort(buildSort("renewalDate", "asc")).skip(skip(q.page, q.limit)).limit(q.limit).lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("renewal");
  if ("error" in auth) return auth.error;
  try {
    const parsed = renewalSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid renewal data", 400);
    await connectDB();
    const item = await Renewal.create({ ...parsed.data, createdBy: auth.user.userId, updatedBy: auth.user.userId });
    await RenewalHistory.create({ renewalId: item._id, action: "created", details: item.title, changedBy: auth.user.userId });
    await createNotification({ title: "Renewal Scheduled", message: `${item.title} due ${new Date(item.renewalDate).toLocaleDateString()}`, type: "renewal_due", link: "/domains" });
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

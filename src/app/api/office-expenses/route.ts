import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { officeExpenseSchema } from "@/lib/modules/schemas";
import OfficeExpense from "@/models/modules/OfficeExpense";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("office_expense");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const url = new URL(request.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    const filter: Record<string, unknown> = { ...buildSoftDeleteFilter(q.includeDeleted || false) };
    if (year) filter.year = Number(year);
    if (month) filter.month = Number(month);
    const total = await OfficeExpense.countDocuments(filter);
    const items = await OfficeExpense.find(filter).sort(buildSort("expenseDate", "desc")).skip(skip(q.page, q.limit)).limit(q.limit).lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("office_expense");
  if ("error" in auth) return auth.error;
  try {
    const parsed = officeExpenseSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid expense data", 400);
    await connectDB();
    const expenseDate = parsed.data.expenseDate || new Date();
    const d = new Date(expenseDate);
    const item = await OfficeExpense.create({
      ...parsed.data,
      expenseDate: d,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

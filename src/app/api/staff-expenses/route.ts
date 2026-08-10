import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { staffExpenseSchema, approvalSchema } from "@/lib/modules/schemas";
import { createNotification } from "@/lib/notifications";
import StaffExpense from "@/models/modules/StaffExpense";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("staff_expense");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const filter: Record<string, unknown> = { ...buildSoftDeleteFilter(q.includeDeleted || false), ...(q.status && q.status !== "All" ? { status: q.status } : {}) };
    if (auth.user.role === "Employee") filter.employeeId = auth.user.userId;
    const total = await StaffExpense.countDocuments(filter);
    const items = await StaffExpense.find(filter).sort(buildSort("expenseDate", "desc")).skip(skip(q.page, q.limit)).limit(q.limit).lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("staff_expense");
  if ("error" in auth) return auth.error;
  try {
    const parsed = staffExpenseSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid expense data", 400);
    await connectDB();
    const item = await StaffExpense.create({ ...parsed.data, createdBy: auth.user.userId, updatedBy: auth.user.userId });
    await createNotification({ title: "Expense Submitted", message: `${parsed.data.employeeName} submitted ${parsed.data.category} expense`, type: "expense_approval", link: "/staff-expenses" });
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireModuleAuth("staff_expense");
  if ("error" in auth) return auth.error;
  if (auth.user.role !== "Admin" && auth.user.role !== "HR") return jsonError("Forbidden", 403);
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return jsonError("Id required", 400);
    const parsed = approvalSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid approval data", 400);
    await connectDB();
    const item = await StaffExpense.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { status: parsed.data.status, approvedBy: auth.user.userId, approvedAt: new Date(), rejectionReason: parsed.data.rejectionReason || "", updatedBy: auth.user.userId },
      { new: true },
    ).lean();
    if (!item) return jsonError("Not found", 404);
    return NextResponse.json({ item: { ...item, _id: String(item._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

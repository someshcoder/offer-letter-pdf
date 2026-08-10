import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { salaryCalculationSchema } from "@/lib/modules/schemas";
import SalaryCalculation from "@/models/modules/SalaryCalculation";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("salary");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    const filter: Record<string, unknown> = { ...buildSoftDeleteFilter(q.includeDeleted || false) };
    if (employeeId) filter.employeeId = employeeId;
    if (q.search) {
      filter.employeeName = { $regex: q.search, $options: "i" };
    }
    const total = await SalaryCalculation.countDocuments(filter);
    const items = await SalaryCalculation.find(filter)
      .sort(buildSort("createdAt", "desc"))
      .skip(skip(q.page, q.limit))
      .limit(q.limit)
      .lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("salary");
  if ("error" in auth) return auth.error;
  try {
    const parsed = salaryCalculationSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid salary calculation", 400);
    await connectDB();
    const item = await SalaryCalculation.create({
      ...parsed.data,
      employeeId: parsed.data.employeeId || undefined,
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });
    return NextResponse.json(
      { item: { ...item.toObject(), _id: String(item._id) } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

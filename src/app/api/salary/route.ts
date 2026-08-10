import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { salarySchema } from "@/lib/modules/schemas";
import { createNotification } from "@/lib/notifications";
import SalaryRecord from "@/models/modules/SalaryRecord";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("salary");
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
    const total = await SalaryRecord.countDocuments(filter);
    const items = await SalaryRecord.find(filter).sort(buildSort("createdAt", "desc")).skip(skip(q.page, q.limit)).limit(q.limit).lean();
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("salary");
  if ("error" in auth) return auth.error;
  try {
    const parsed = salarySchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid salary data", 400);
    await connectDB();
    const base = parsed.data.baseSalary || 0;
    const bonus = parsed.data.bonus || 0;
    const incentive = parsed.data.incentive || 0;
    const deduction = parsed.data.deduction || 0;
    const advance = parsed.data.advanceSalary || 0;
    const netSalary = base + bonus + incentive - deduction - advance;
    const item = await SalaryRecord.create({
      ...parsed.data,
      baseSalary: base,
      bonus,
      incentive,
      deduction,
      advanceSalary: advance,
      netSalary,
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });
    await createNotification({ title: "Salary Due", message: `Salary for ${parsed.data.employeeName} - ${parsed.data.month}/${parsed.data.year}`, type: "salary_due", link: "/attendance" });
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

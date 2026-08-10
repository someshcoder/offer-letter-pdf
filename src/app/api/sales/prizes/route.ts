import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireAuth } from "@/lib/apiAuth";
import { logAudit, getClientIp } from "@/lib/audit";
import SalesPrize, { PRIZE_METRICS, PRIZE_PERIODS } from "@/models/modules/SalesPrize";
import { z } from "zod";

const prizeSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  reward: z.string().trim().min(1),
  metric: z.enum(PRIZE_METRICS),
  targetValue: z.coerce.number().min(0),
  period: z.enum(PRIZE_PERIODS).optional(),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAuth(["Admin", "HR", "TL", "Employee"]);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const items = await SalesPrize.find({ deletedAt: null })
      .sort({ sortOrder: 1, targetValue: 1 })
      .lean();

    // Employees only see active prizes
    const filtered =
      auth.user.role === "Admin" || auth.user.role === "HR"
        ? items
        : items.filter((p) => p.isActive !== false);

    return NextResponse.json({
      items: filtered.map((p) => ({ ...p, _id: String(p._id) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(["Admin", "HR"]);
  if ("error" in auth) return auth.error;

  try {
    const parsed = prizeSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid prize data", 400);

    await connectDB();
    const item = await SalesPrize.create({
      ...parsed.data,
      period: parsed.data.period || "all_time",
      sortOrder: parsed.data.sortOrder ?? 0,
      isActive: parsed.data.isActive ?? true,
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "create",
      module: "sales",
      entityId: String(item._id),
      details: `Sales prize created: ${item.title}`,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json(
      { item: { ...item.toObject(), _id: String(item._id) } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

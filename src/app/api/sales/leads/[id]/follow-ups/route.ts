import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { followUpSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import Lead, { LeadFollowUp } from "@/models/modules/Lead";

export async function GET(_req: Request, ctx: RouteContext<"/api/sales/leads/[id]/follow-ups">) {
  const auth = await requireModuleAuth("sales");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    await connectDB();
    const items = await LeadFollowUp.find({ leadId: id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      items: items.map((f) => ({ ...f, _id: String(f._id), leadId: String(f.leadId) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/sales/leads/[id]/follow-ups">) {
  const auth = await requireModuleAuth("sales");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = followUpSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid follow-up data", 400);

    await connectDB();
    const lead = await Lead.findOne({ _id: id, deletedAt: null });
    if (!lead) return jsonError("Lead not found", 404);

    const followUp = await LeadFollowUp.create({
      leadId: id,
      note: parsed.data.note,
      followUpDate: parsed.data.followUpDate || new Date(),
      status: parsed.data.status || lead.status,
      createdBy: auth.user.userId,
      createdByName: auth.user.email,
    });

    if (parsed.data.status) {
      lead.status = parsed.data.status as typeof lead.status;
    }
    if (parsed.data.followUpDate) {
      lead.nextFollowUpDate = parsed.data.followUpDate;
    }
    lead.updatedBy = auth.user.userId;
    await lead.save();

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "update",
      module: "sales",
      entityId: id,
      details: `Follow-up added for lead: ${lead.name}`,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json(
      { item: { ...followUp.toObject(), _id: String(followUp._id), leadId: String(followUp.leadId) } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

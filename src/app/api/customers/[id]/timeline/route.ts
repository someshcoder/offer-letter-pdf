import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { customerAssignSchema, customerNoteSchema } from "@/lib/modules/schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import Client from "@/models/Client";
import { CustomerActivity, CustomerNote } from "@/models/modules/CustomerActivity";
import Project from "@/models/modules/Project";
import Domain from "@/models/modules/Domain";
import MarketingPayment from "@/models/modules/MarketingPayment";
import MaintenanceService from "@/models/modules/MaintenanceService";

export async function GET(_req: Request, ctx: RouteContext<"/api/customers/[id]/timeline">) {
  const auth = await requireModuleAuth("customer");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    await connectDB();
    const [activities, notes, projects, domains, payments, maintenance] = await Promise.all([
      CustomerActivity.find({ clientId: id }).sort({ createdAt: -1 }).limit(100).lean(),
      CustomerNote.find({ clientId: id }).sort({ createdAt: -1 }).lean(),
      Project.find({ clientId: id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
      Domain.find({ clientId: id, deletedAt: null }).sort({ expiryDate: 1 }).lean(),
      MarketingPayment.find({ clientId: id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
      MaintenanceService.find({ clientId: id, deletedAt: null }).sort({ renewalDate: 1 }).lean(),
    ]);
    return NextResponse.json({
      activities: activities.map((a) => ({ ...a, _id: String(a._id) })),
      notes: notes.map((n) => ({ ...n, _id: String(n._id) })),
      projects: projects.map((p) => ({ ...p, _id: String(p._id) })),
      domains: domains.map((d) => ({ ...d, _id: String(d._id) })),
      payments: payments.map((p) => ({ ...p, _id: String(p._id) })),
      maintenance: maintenance.map((m) => ({ ...m, _id: String(m._id) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/customers/[id]/timeline">) {
  const auth = await requireModuleAuth("customer");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const body = await request.json();

    await connectDB();
    const client = await Client.findById(id);
    if (!client) return jsonError("Customer not found", 404);

    if (action === "assign") {
      const parsed = customerAssignSchema.safeParse(body);
      if (!parsed.success) return jsonError("Invalid assignment data", 400);

      client.assignedStaffId = parsed.data.assignedStaffId as unknown as typeof client.assignedStaffId;
      client.assignedStaffName = parsed.data.assignedStaffName;
      client.updatedBy = auth.user.userId;
      await client.save();

      await CustomerActivity.create({
        clientId: id,
        action: "staff_assigned",
        details: `Assigned to ${parsed.data.assignedStaffName}`,
        module: "customer",
        changedBy: auth.user.userId,
      });

      await createNotification({
        title: "Customer Staff Assigned",
        message: `${client.name} assigned to ${parsed.data.assignedStaffName}`,
        type: "new_customer",
        link: `/clients`,
      });

      return NextResponse.json({ client: { ...client.toObject(), _id: String(client._id) } });
    }

    if (action === "note") {
      const parsed = customerNoteSchema.safeParse(body);
      if (!parsed.success) return jsonError("Invalid note data", 400);

      const note = await CustomerNote.create({
        clientId: id,
        note: parsed.data.note,
        createdBy: auth.user.userId,
        createdByName: auth.user.email,
      });

      await logAudit({
        userId: auth.user.userId,
        userEmail: auth.user.email,
        action: "create",
        module: "customer",
        entityId: id,
        details: "Customer note added",
        ipAddress: getClientIp(request),
      });

      return NextResponse.json({ note: { ...note.toObject(), _id: String(note._id) } }, { status: 201 });
    }

    return jsonError("Invalid action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}

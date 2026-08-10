import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { projectUpdateSchema } from "@/lib/modules/schemas";
import { syncProjectLinks } from "@/lib/modules/projectLinks";
import { logAudit, getClientIp } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import Project from "@/models/modules/Project";
import StaffAllocation from "@/models/modules/StaffAllocation";
import ProjectMilestone from "@/models/modules/ProjectMilestone";
import Client from "@/models/Client";
import Domain from "@/models/modules/Domain";
import MarketingPayment from "@/models/modules/MarketingPayment";
import MaintenanceService from "@/models/modules/MaintenanceService";
import { CustomerActivity } from "@/models/modules/CustomerActivity";

export async function GET(_req: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const auth = await requireModuleAuth("project");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    await connectDB();
    const item = await Project.findOne({ _id: id, deletedAt: null }).lean();
    if (!item) return jsonError("Project not found", 404);

    const [client, staff, milestones, domains, payments, maintenance, activities] = await Promise.all([
      Client.findById(item.clientId).lean(),
      StaffAllocation.find({ projectId: id, isActive: true }).lean(),
      ProjectMilestone.find({ projectId: id, deletedAt: null }).sort({ deadline: 1 }).lean(),
      Domain.find({ projectId: id, deletedAt: null }).sort({ expiryDate: 1 }).lean(),
      MarketingPayment.find({ projectId: id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
      MaintenanceService.find({ projectId: id, deletedAt: null }).sort({ renewalDate: 1 }).lean(),
      CustomerActivity.find({ clientId: item.clientId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return NextResponse.json({
      item: { ...item, _id: String(item._id) },
      client: client ? { ...client, _id: String(client._id) } : null,
      staff: staff.map((s) => ({ ...s, _id: String(s._id) })),
      milestones: milestones.map((m) => ({ ...m, _id: String(m._id) })),
      domains: domains.map((d) => ({ ...d, _id: String(d._id) })),
      payments: payments.map((p) => ({ ...p, _id: String(p._id) })),
      maintenance: maintenance.map((m) => ({ ...m, _id: String(m._id) })),
      activities: activities.map((a) => ({ ...a, _id: String(a._id) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const auth = await requireModuleAuth("project");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = projectUpdateSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid update data", 400);

    await connectDB();
    const item = await Project.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { ...parsed.data, updatedBy: auth.user.userId },
      { new: true, runValidators: true },
    ).lean();
    if (!item) return jsonError("Project not found", 404);

    const clientId = String(parsed.data.clientId ?? item.clientId);
    await syncProjectLinks({
      projectId: id,
      clientId,
      projectName: item.name,
      body,
      userId: auth.user.userId,
      domainId: body.domainId ? String(body.domainId) : undefined,
      paymentId: body.paymentId ? String(body.paymentId) : undefined,
      maintenanceId: body.maintenanceId ? String(body.maintenanceId) : undefined,
    });

    if (parsed.data.status === "Completed") {
      await createNotification({
        title: "Project Completed",
        message: `Project "${item.name}" has been marked completed`,
        type: "project_completed",
        link: `/projects/${id}`,
        entityModule: "project",
        entityId: id,
      });
    }

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "update",
      module: "project",
      entityId: id,
      details: `Project updated: ${item.name}`,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ item: { ...item, _id: String(item._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const auth = await requireModuleAuth("project");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    await connectDB();
    const item = await Project.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), deletedBy: auth.user.userId, isActive: false },
      { new: true },
    ).lean();
    if (!item) return jsonError("Project not found", 404);

    await logAudit({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "delete",
      module: "project",
      entityId: id,
      details: `Project soft deleted: ${item.name}`,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}

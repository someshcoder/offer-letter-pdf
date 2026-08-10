import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Client from "@/models/Client";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireAuth } from "@/lib/apiAuth";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import { clientPayloadSchema, mapClientDetail } from "@/lib/clients";

const updateClientSchema = clientPayloadSchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required.",
});

export async function GET(_request: Request, ctx: RouteContext<"/api/clients/[id]">) {
  const auth = await requireAuth(["Admin", "HR", "TL", "Employee"]);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const { id } = await ctx.params;
    const client = await Client.findOne({ _id: id, deletedAt: null }).lean();
    if (!client) return jsonError("Customer not found", 404);
    return NextResponse.json(mapClientDetail(client as Record<string, unknown>));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/clients/[id]">) {
  const auth = await requireModuleAuth("customer");
  if ("error" in auth) return auth.error;

  try {
    const data = await request.json();
    const parsed = updateClientSchema.safeParse(data);
    if (!parsed.success) return jsonError("Invalid customer data", 400);

    const { id } = await ctx.params;
    await connectDB();

    const update: Record<string, unknown> = {
      updatedBy: auth.user.userId,
    };

    if (parsed.data.name !== undefined) update.name = parsed.data.name;
    if (parsed.data.mobileNumber !== undefined) update.mobileNumber = parsed.data.mobileNumber;
    if (parsed.data.email !== undefined) update.email = parsed.data.email || "";
    if (parsed.data.address !== undefined) update.address = parsed.data.address || "";
    if (parsed.data.city !== undefined) update.city = parsed.data.city || "";
    if (parsed.data.state !== undefined) update.state = parsed.data.state || "";
    if (parsed.data.status !== undefined) update.status = parsed.data.status;
    if (parsed.data.customerNotes !== undefined) update.customerNotes = parsed.data.customerNotes || "";
    if (parsed.data.assignedStaffId !== undefined) update.assignedStaffId = parsed.data.assignedStaffId || null;
    if (parsed.data.assignedStaffName !== undefined) update.assignedStaffName = parsed.data.assignedStaffName || "";
    if (parsed.data.companyName !== undefined) {
      update["domainDetails.businessName"] = parsed.data.companyName || "";
    }

    const updatedClient = await Client.findOneAndUpdate({ _id: id, deletedAt: null }, update, {
      new: true,
      runValidators: true,
      lean: true,
    });
    if (!updatedClient) return jsonError("Customer not found", 404);
    return NextResponse.json(mapClientDetail(updatedClient as Record<string, unknown>));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/clients/[id]">) {
  const auth = await requireModuleAuth("customer");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    await connectDB();
    const deletedClient = await Client.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), deletedBy: auth.user.userId, isActive: false },
      { new: true, lean: true },
    );
    if (!deletedClient) return jsonError("Customer not found", 404);
    return NextResponse.json({ message: "Customer deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}

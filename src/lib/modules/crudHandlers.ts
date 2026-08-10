import { NextResponse } from "next/server";
import type { Model } from "mongoose";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import type { ModuleName } from "@/types/modules/common";
import { logAudit, getClientIp } from "@/lib/audit";
import type { z } from "zod";

export function createModuleIdHandlers<T extends ModuleName>({
  module,
  Model,
  updateSchema,
}: {
  module: T;
  Model: Model<unknown>;
  updateSchema: z.ZodTypeAny;
}) {
  async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
    const auth = await requireModuleAuth(module);
    if ("error" in auth) return auth.error;
    try {
      const { id } = await ctx.params;
      const parsed = updateSchema.safeParse(await request.json());
      if (!parsed.success) return jsonError("Invalid update data", 400);
      await connectDB();
      const item = await Model.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { ...(parsed.data as Record<string, unknown>), updatedBy: auth.user.userId },
        { new: true, runValidators: true },
      ).lean();
      if (!item) return jsonError("Not found", 404);
      await logAudit({ userId: auth.user.userId, userEmail: auth.user.email, action: "update", module, entityId: id, details: "Record updated", ipAddress: getClientIp(request) });
      return NextResponse.json({ item: { ...item, _id: String((item as { _id: unknown })._id) } });
    } catch (error) {
      return handleApiError(error);
    }
  }

  async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
    const auth = await requireModuleAuth(module);
    if ("error" in auth) return auth.error;
    try {
      const { id } = await ctx.params;
      await connectDB();
      const item = await Model.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { deletedAt: new Date(), deletedBy: auth.user.userId, isActive: false },
        { new: true },
      ).lean();
      if (!item) return jsonError("Not found", 404);
      await logAudit({ userId: auth.user.userId, userEmail: auth.user.email, action: "delete", module, entityId: id, details: "Record soft deleted", ipAddress: getClientIp(request) });
      return NextResponse.json({ message: "Deleted" });
    } catch (error) {
      return handleApiError(error);
    }
  }

  return { PATCH, DELETE };
}

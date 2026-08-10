import AuditLog from "@/models/AuditLog";
import connectDB from "@/lib/mongodb";
import type { AuditAction, ModuleName } from "@/types/modules/common";

export async function logAudit({
  userId,
  userEmail,
  action,
  module,
  entityId,
  details,
  metadata,
  ipAddress,
}: {
  userId: string;
  userEmail?: string;
  action: AuditAction;
  module: ModuleName;
  entityId?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await connectDB();
    await AuditLog.create({
      userId,
      userEmail: userEmail || "",
      action,
      module,
      entityId,
      details,
      metadata: metadata || {},
      ipAddress: ipAddress || "unknown",
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

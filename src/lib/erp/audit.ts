import ErpAuditLog from "@/models/erp/ErpAuditLog";
import connectDB from "@/lib/mongodb";

export async function logAudit({
  userId,
  action,
  module,
  details,
  ipAddress,
}: {
  userId: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
}) {
  try {
    await connectDB();
    await ErpAuditLog.create({
      userId,
      action,
      module,
      details,
      ipAddress: ipAddress || "unknown",
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

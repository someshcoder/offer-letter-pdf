import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";
import Employee from "@/models/Employee";

export async function GET() {
  const auth = await requireAuth(["Admin", "HR", "TL"]);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();

    const rows = await Employee.find({ accessRole: { $in: ["Admin", "HR", "TL"] } })
      .select("employeeName accessRole")
      .sort({ employeeName: 1 })
      .lean();

    return NextResponse.json({
      items: rows.map((row) => ({
        id: String(row._id),
        name: row.employeeName,
        role: row.accessRole,
      })),
    });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({ items: [], warning: issue.message }, { status: issue.status });
  }
}

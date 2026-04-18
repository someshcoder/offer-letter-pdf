import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET() {
  try {
    await connectDB();

    const rows = await Employee.find({ accessRole: { $in: ["Admin", "HR", "TL"] } })
      .select("employeeName accessRole email mobileNumber")
      .sort({ employeeName: 1 })
      .lean();

    return NextResponse.json({
      items: rows.map((row) => ({
        id: String(row._id),
        name: row.employeeName,
        role: row.accessRole,
        email: row.email,
        mobileNumber: row.mobileNumber,
      })),
    });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({ items: [], warning: issue.message }, { status: issue.status });
  }
}

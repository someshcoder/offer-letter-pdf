import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import Employee from "@/models/Employee";

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || (auth.role !== "Admin" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const employeeIds = Array.isArray(body.employeeIds)
      ? body.employeeIds.map(String)
      : body.employeeId
        ? [String(body.employeeId)]
        : [];

    if (employeeIds.length === 0) {
      return NextResponse.json({ error: "Employee id required." }, { status: 400 });
    }

    const result = await Employee.updateMany(
      { _id: { $in: employeeIds }, accessRole: "Employee" },
      { $unset: { reportingTL: "" } },
    );

    return NextResponse.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}

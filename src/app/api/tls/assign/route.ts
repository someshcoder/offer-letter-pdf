import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const tlId = String(body.tlId || "").trim();
    const employeeIds = Array.isArray(body.employeeIds) ? body.employeeIds.map(String) : [];

    if (!tlId || employeeIds.length === 0) {
      return NextResponse.json(
        { error: "Team leader and at least one employee selection are required." },
        { status: 400 },
      );
    }

    const tl = await Employee.findById(tlId).lean();
    if (!tl || tl.accessRole !== "TL") {
      return NextResponse.json({ error: "Selected Team Leader is not valid." }, { status: 404 });
    }

    const update = {
      reportingTL: {
        id: String(tl._id),
        employeeName: tl.employeeName,
        email: tl.email,
      },
    };

    const result = await Employee.updateMany(
      { _id: { $in: employeeIds }, accessRole: "Employee" },
      { $set: update },
    );

    return NextResponse.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}

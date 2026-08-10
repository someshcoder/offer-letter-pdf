import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import SavedPdf from "@/lib/models/SavedPdf";
import type { DashboardItem } from "@/lib/dashboardTypes";
import { normalizeDocumentKind } from "@/lib/formTypes";
import Employee from "@/models/Employee";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthFromCookies();

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({
      items: [] as DashboardItem[],
      error: "Add MONGODB_URI to .env.local to enable the dashboard.",
      employeeTotal: 0,
      roleCounts: { Admin: 0, Employee: 0, TL: 0, HR: 0 },
      recentEmployees: [],
    });
  }

  try {
    await connectDB();

    const rows = await SavedPdf.find()
      .sort({ createdAt: -1 })
      .limit(25)
      .select("-pdfBuffer")
      .lean();

    const items: DashboardItem[] = rows.map((r) => ({
      id: String(r._id),
      title: r.title,
      documentKind: normalizeDocumentKind(r.documentKind),
      storage: "remote",
      refNo: r.form?.refNo,
      name: r.form?.name,
      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : String(r.createdAt),
      mailSentAt:
        r.mailSentAt instanceof Date
          ? r.mailSentAt.toISOString()
          : r.mailSentAt
            ? String(r.mailSentAt)
            : undefined,
      mailError: r.mailError || undefined,
      lastMailTo: r.lastMailTo || undefined,
    }));

    const filter: Record<string, unknown> = {};
    if (auth?.role === "TL") {
      filter["reportingTL.email"] = auth.email;
    }

    const roleCounts = { Admin: 0, Employee: 0, TL: 0, HR: 0 };

    const [employeeTotal, roleRaw, recentRows] = await Promise.all([
      Employee.countDocuments(filter),
      Employee.aggregate([
        { $match: filter },
        { $group: { _id: "$accessRole", count: { $sum: 1 } } },
      ]),
      Employee.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("employeeName accessRole designation")
        .lean(),
    ]);

    for (const row of roleRaw) {
      if (row._id in roleCounts) {
        roleCounts[row._id as keyof typeof roleCounts] = row.count;
      }
    }

    const recentEmployees = recentRows.map((emp) => ({
      id: String(emp._id),
      name: emp.employeeName,
      role: emp.accessRole,
      designation: emp.designation,
    }));

    return NextResponse.json({
      items,
      error: null,
      employeeTotal,
      roleCounts,
      recentEmployees,
    });
  } catch (cause) {
    return NextResponse.json({
      items: [] as DashboardItem[],
      error: getMongoIssue(cause).message,
      employeeTotal: 0,
      roleCounts: { Admin: 0, Employee: 0, TL: 0, HR: 0 },
      recentEmployees: [],
    });
  }
}

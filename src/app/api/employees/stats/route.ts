import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import Employee from "@/models/Employee";
import { mapEmployee } from "@/lib/employeeMapper";

export async function GET() {
  const emptyStats = {
    total: 0,
    roleWise: {
      Admin: 0,
      Employee: 0,
      TL: 0,
      HR: 0,
    },
    recentEmployees: [],
  };

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({
      ...emptyStats,
      warning: "MONGODB_URI is not configured. Employee stats are empty.",
    });
  }

  try {
    await connectDB();

    const [total, roleWiseRaw, recentRaw] = await Promise.all([
      Employee.countDocuments(),
      Employee.aggregate([{ $group: { _id: "$accessRole", count: { $sum: 1 } } }]),
      Employee.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const roleWise = {
      Admin: 0,
      Employee: 0,
      TL: 0,
      HR: 0,
    };

    for (const row of roleWiseRaw) {
      if (row._id in roleWise) {
        roleWise[row._id as keyof typeof roleWise] = row.count;
      }
    }

    return NextResponse.json({
      total,
      roleWise,
      recentEmployees: recentRaw.map((r) => mapEmployee(r)),
    });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({
      ...emptyStats,
      warning: issue.message,
    });
  }
}

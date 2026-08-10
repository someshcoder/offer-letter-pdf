import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";
import { handleApiError } from "@/lib/apiResponse";
import Employee from "@/models/Employee";
import Task from "@/models/modules/Task";

export async function GET() {
  const auth = await requireAuth(["TL", "Admin", "HR"]);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const team =
      auth.user.role === "TL"
        ? await Employee.find({
            $or: [
              { "reportingTL.id": auth.user.userId },
              { "reportingTL.email": auth.user.email },
            ],
          })
            .select("_id employeeName email mobileNumber designation")
            .sort({ employeeName: 1 })
            .lean()
        : [];

    const teamIds = team.map((employee) => String(employee._id));
    const taskFilter =
      auth.user.role === "TL"
        ? {
            deletedAt: null,
            $or: [{ assignedStaffIds: { $in: teamIds } }, { createdBy: auth.user.userId }],
          }
        : { deletedAt: null };

    const tasks = await Task.find(taskFilter).sort({ updatedAt: -1 }).limit(100).lean();

    return NextResponse.json({
      team: team.map((employee) => ({
        ...employee,
        _id: String(employee._id),
      })),
      tasks: tasks.map((task) => ({
        ...task,
        _id: String(task._id),
        assignedStaffIds: (task.assignedStaffIds || []).map(String),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

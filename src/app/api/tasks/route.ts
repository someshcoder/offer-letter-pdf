import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth, mapDocs } from "@/lib/modules/apiHelpers";
import { parseListQuery, buildSoftDeleteFilter, buildSearchFilter, buildSort, paginated, skip } from "@/lib/modules/query";
import { taskSchema, taskCommentSchema } from "@/lib/modules/schemas";
import { createNotification } from "@/lib/notifications";
import Task, { TaskComment, TaskHistory } from "@/models/modules/Task";
import Employee from "@/models/Employee";

export async function GET(request: Request) {
  const auth = await requireModuleAuth("task");
  if ("error" in auth) return auth.error;
  try {
    await connectDB();
    const q = parseListQuery(request.url);
    const filter: Record<string, unknown> = {
      ...buildSoftDeleteFilter(q.includeDeleted || false),
      ...(q.status && q.status !== "All" ? { status: q.status } : {}),
      ...buildSearchFilter(q.search || "", ["title", "description"]),
    };
    const url = new URL(request.url);
    if (auth.user.role === "Employee") {
      filter.assignedStaffIds = auth.user.userId;
    } else if (auth.user.role === "TL") {
      const teamIds = await getTlTeamIds(auth.user.userId, auth.user.email);
      // TL can request a specific staffId as long as it's in their team
      const requestedStaffId = url.searchParams.get("staffId");
      if (requestedStaffId) {
         if (teamIds.includes(requestedStaffId)) {
           filter.assignedStaffIds = requestedStaffId;
         } else {
           // Fallback to viewing own team
           filter.$or = [
             { assignedStaffIds: { $in: teamIds } },
             { createdBy: auth.user.userId },
           ];
         }
      } else {
        filter.$or = [
          { assignedStaffIds: { $in: teamIds } },
          { createdBy: auth.user.userId },
        ];
      }
    } else {
      // Admin / HR
      const requestedStaffId = url.searchParams.get("staffId");
      if (requestedStaffId) {
        filter.assignedStaffIds = requestedStaffId;
      }
    }
    const [total, items] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter).sort(buildSort("dueDate", "asc")).skip(skip(q.page, q.limit)).limit(q.limit).lean(),
    ]);
    return NextResponse.json(paginated(mapDocs(items), q.page, q.limit, total));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("task");
  if ("error" in auth) return auth.error;
  try {
    const body = normalizeTaskPayload(await request.json());
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid task data", 400);
    await connectDB();
    if (auth.user.role === "Employee") {
      return jsonError("Employees cannot assign tasks", 403);
    }
    if (auth.user.role === "TL") {
      const teamIds = await getTlTeamIds(auth.user.userId, auth.user.email);
      const assignedIds = parsed.data.assignedStaffIds || [];
      const hasOutsideTeam = assignedIds.some((id) => !teamIds.includes(id));
      if (hasOutsideTeam) return jsonError("TL can assign tasks only to own team", 403);
    }
    const taskData = await withAssignedStaffNames(parsed.data);
    const item = await Task.create({ ...taskData, createdBy: auth.user.userId, updatedBy: auth.user.userId });
    await TaskHistory.create({ taskId: item._id, action: "created", details: item.title, changedBy: auth.user.userId });
    const assignedIds = parsed.data.assignedStaffIds || [];
    await Promise.all([
      ...assignedIds.map((userId) =>
        createNotification({
          userId,
          title: "Task Assigned",
          message: item.title,
          type: "task_assigned",
          link: "/employee-dashboard",
          entityModule: "task",
          entityId: String(item._id),
        }),
      ),
      createNotification({
        title: "Task Assigned",
        message: `${auth.user.name || auth.user.email} assigned task: ${item.title}`,
        type: "task_assigned",
        link: "/tasks",
        entityModule: "task",
        entityId: String(item._id),
      }),
    ]);
    return NextResponse.json({ item: { ...item.toObject(), _id: String(item._id) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireModuleAuth("task");
  if ("error" in auth) return auth.error;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action");
    if (!id) return jsonError("Id required", 400);
    await connectDB();
    const accessFilter = await buildTaskAccessFilter(id, auth.user);
    const existing = await Task.findOne(accessFilter).lean();
    if (!existing) return jsonError("Task not found or not allowed", 404);

    if (action === "comment") {
      const parsed = taskCommentSchema.safeParse(await request.json());
      if (!parsed.success) return jsonError("Invalid comment", 400);
      const comment = await TaskComment.create({ taskId: id, comment: parsed.data.comment, authorId: auth.user.userId, authorName: auth.user.name || auth.user.email });
      return NextResponse.json({ item: { ...comment.toObject(), _id: String(comment._id) } }, { status: 201 });
    }

    const body = normalizeTaskPayload(await request.json());
    const parsed = taskSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError("Invalid update", 400);
    let updates = { ...parsed.data, updatedBy: auth.user.userId } as Record<string, unknown>;
    if (auth.user.role === "Employee") {
      updates = {
        status: parsed.data.status,
        progress: parsed.data.progress,
        employeeRemark: parsed.data.employeeRemark,
        estimatedTime: parsed.data.estimatedTime,
        actualTime: parsed.data.actualTime,
        updatedBy: auth.user.userId,
      };
    }
    if (parsed.data.status === "Completed") {
      updates.completedAt = new Date();
      updates.progress = 100;
    }
    const item = await Task.findOneAndUpdate(accessFilter, updates, { new: true }).lean();
    if (!item) return jsonError("Not found", 404);
    await TaskHistory.create({
      taskId: id,
      action: "updated",
      details: `${auth.user.name || auth.user.email} updated task`,
      changedBy: auth.user.userId,
    });
    const statusText = String(item.status || parsed.data.status || "Updated");
    const actorName = auth.user.name || auth.user.email;
    const taskTitle = String(item.title || "Task");
    if (auth.user.role === "Employee" && parsed.data.status === "Completed") {
      const remark = parsed.data.employeeRemark ? ` — ${parsed.data.employeeRemark}` : "";
      const message = `${actorName} completed task: "${taskTitle}"${remark}`;
      await Promise.all(
        ["Admin", "HR", "TL"].map((role) =>
          createNotification({
            targetRole: role,
            title: "Task Completed",
            message,
            type: "task_completed",
            link: "/tasks",
            entityModule: "task",
            entityId: id,
          }),
        ),
      );
      if (item.createdBy && String(item.createdBy) !== auth.user.userId) {
        await createNotification({
          userId: String(item.createdBy),
          title: "Task Completed",
          message,
          type: "task_completed",
          link: "/tl-dashboard",
          entityModule: "task",
          entityId: id,
        });
      }
    } else if (auth.user.role !== "Employee") {
      const adminMessage = `${actorName} updated "${taskTitle}" to ${statusText}`;
      await createNotification({
        title: `Task ${statusText}`,
        message: adminMessage,
        type: "task_assigned",
        link: "/tasks",
        entityModule: "task",
        entityId: id,
      });
    }
    return NextResponse.json({ item: { ...item, _id: String(item._id) } });
  } catch (error) {
    return handleApiError(error);
  }
}

function normalizeTaskPayload(body: Record<string, unknown>) {
  const next = { ...body };
  if (typeof next.assignedStaffIds === "string") {
    next.assignedStaffIds = next.assignedStaffIds ? [next.assignedStaffIds] : [];
  }
  if (typeof next.assignedStaffNames === "string") {
    next.assignedStaffNames = next.assignedStaffNames ? [next.assignedStaffNames] : [];
  }
  return next;
}

async function withAssignedStaffNames<T extends { assignedStaffIds?: string[]; assignedStaffNames?: string[] }>(
  data: T,
) {
  if (!data.assignedStaffIds?.length || data.assignedStaffNames?.length) return data;
  const employees = await Employee.find({ _id: { $in: data.assignedStaffIds } })
    .select("_id employeeName")
    .lean();
  const nameMap = new Map(employees.map((employee) => [String(employee._id), employee.employeeName]));
  return {
    ...data,
    assignedStaffNames: data.assignedStaffIds.map((id) => nameMap.get(id) || id),
  };
}

async function getTlTeamIds(tlId: string, tlEmail: string) {
  const team = await Employee.find({
    $or: [{ "reportingTL.id": tlId }, { "reportingTL.email": tlEmail }],
  })
    .select("_id")
    .lean();
  return team.map((employee) => String(employee._id));
}

async function buildTaskAccessFilter(
  id: string,
  user: { userId: string; email: string; role: string },
) {
  const base = { _id: id, deletedAt: null } as Record<string, unknown>;
  if (user.role === "Employee") {
    return { ...base, assignedStaffIds: user.userId };
  }
  if (user.role === "TL") {
    const teamIds = await getTlTeamIds(user.userId, user.email);
    return {
      ...base,
      $or: [{ assignedStaffIds: { $in: teamIds } }, { createdBy: user.userId }],
    };
  }
  return base;
}

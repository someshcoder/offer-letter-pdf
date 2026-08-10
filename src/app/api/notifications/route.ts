import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError } from "@/lib/apiResponse";
import { requireAuth } from "@/lib/apiAuth";
import Notification from "@/models/Notification";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    if (auth.user.role === "Employee") {
      return NextResponse.json({ items: [], unreadCount: 0 });
    }

    const filter: Record<string, unknown> = {
      type: "task_completed",
    };
    if (unreadOnly) filter.read = false;

    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ ...filter, read: false }),
    ]);
    return NextResponse.json({
      items: items.map((n) => ({ ...n, _id: String(n._id) })),
      unreadCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const { id, markAll } = await request.json();
    await connectDB();
    if (markAll) {
      await Notification.updateMany({ read: false, type: "task_completed" }, { read: true });
      return NextResponse.json({ message: "All marked read" });
    }
    if (id) {
      await Notification.findByIdAndUpdate(id, { read: true });
      return NextResponse.json({ message: "Marked read" });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";
import { handleApiError } from "@/lib/apiResponse";
import LoginSession from "@/models/LoginSession";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    const nowDate = new Date();
    const startOfDay = new Date(nowDate);
    startOfDay.setHours(0, 0, 0, 0);
    const filter: Record<string, unknown> = {
      lastSeenAt: { $gte: startOfDay },
    };
    if (role && role !== "All") filter.role = role;

    const sessions = await LoginSession.find(filter)
      .sort({ loginAt: -1 })
      .limit(100)
      .lean();

    const now = nowDate.getTime();
    const items = sessions.map((session) => {
      const lastSeen = new Date(session.lastSeenAt).getTime();
      const active = Boolean(session.active && now - lastSeen < 2 * 60_000);
      const todaySeconds = sessionSecondsForToday({ ...session, active }, startOfDay, nowDate);
      return {
        ...session,
        _id: String(session._id),
        active,
        todaySeconds,
      };
    });

    return NextResponse.json({
      items,
      summary: {
        total: items.length,
        online: items.filter((item) => item.active).length,
        employees: items.filter((item) => item.role === "Employee").length,
        tls: items.filter((item) => item.role === "TL").length,
        todaySeconds: items.reduce((total, item) => total + item.todaySeconds, 0),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function sessionSecondsForToday(
  session: { loginAt: Date; logoutAt?: Date | null; lastSeenAt: Date; active?: boolean },
  startOfDay: Date,
  now: Date,
) {
  const loginAt = new Date(session.loginAt);
  const lastSeenAt = new Date(session.lastSeenAt);
  const logoutAt = session.logoutAt ? new Date(session.logoutAt) : null;
  const start = loginAt > startOfDay ? loginAt : startOfDay;
  const end = session.active ? now : logoutAt || lastSeenAt;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";
import { handleApiError } from "@/lib/apiResponse";
import LoginSession from "@/models/LoginSession";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const sessions = await LoginSession.find({
      userId: auth.user.userId,
      lastSeenAt: { $gte: startOfDay },
    }).lean();

    const totalSeconds = sessions.reduce(
      (total, session) => total + sessionSecondsForToday(session, startOfDay, now),
      0,
    );

    return NextResponse.json({ totalSeconds });
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
  const end = session.active && now.getTime() - lastSeenAt.getTime() < 2 * 60_000
    ? now
    : logoutAt || lastSeenAt;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

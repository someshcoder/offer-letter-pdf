import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAuthCookieName, getAuthFromCookies } from "@/lib/auth";
import LoginSession from "@/models/LoginSession";

export async function POST() {
  const user = await getAuthFromCookies();
  if (user?.sessionId) {
    await connectDB();
    const now = new Date();
    const session = await LoginSession.findById(user.sessionId);
    if (session) {
      session.logoutAt = now;
      session.lastSeenAt = now;
      session.active = false;
      session.durationSeconds = Math.max(
        0,
        Math.round((now.getTime() - new Date(session.loginAt).getTime()) / 1000),
      );
      await session.save();
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: getAuthCookieName(),
    value: "",
    path: "/",
    maxAge: 0,
  });
  return res;
}

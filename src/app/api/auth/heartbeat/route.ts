import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import LoginSession from "@/models/LoginSession";

export async function POST() {
  const user = await getAuthFromCookies();
  if (!user?.sessionId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await connectDB();
  const now = new Date();
  const session = await LoginSession.findById(user.sessionId);
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  session.lastSeenAt = now;
  session.active = true;
  session.durationSeconds = Math.max(
    0,
    Math.round((now.getTime() - new Date(session.loginAt).getTime()) / 1000),
  );
  await session.save();

  return NextResponse.json({ ok: true });
}

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import LoginSession from "@/models/LoginSession";
import { getAuthCookieName, signAuthToken } from "@/lib/auth";
import { ensureAdminUser } from "@/lib/ensureAdminUser";
import { handleApiError } from "@/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    await connectDB();
    await ensureAdminUser();

    const user = await User.findOne({ email })
      .select("_id email role name passwordHash")
      .lean();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await LoginSession.create({
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    const token = signAuthToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
      sessionId: String(session._id),
    });

    const res = NextResponse.json({
      ok: true,
      user: { id: String(user._id), email: user.email, role: user.role, name: user.name },
    });

    res.cookies.set({
      name: getAuthCookieName(),
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (error) {
    return handleApiError(error);
  }
}

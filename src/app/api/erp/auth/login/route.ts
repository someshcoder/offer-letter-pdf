export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import ErpUser from "@/models/erp/ErpUser";
import { signErpToken, getErpCookieName } from "@/lib/erp/auth";
import { cookies } from "next/headers";
import { logAudit } from "@/lib/erp/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    await connectDB();

    const user = await ErpUser.findOne({ email: email.toLowerCase(), isActive: true });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || "");
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const payload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
      franchiseId: user.franchiseId ? (user.franchiseId as any).toString() : undefined,
    };

    const token = signErpToken(payload);

    const cookieStore = await cookies();
    cookieStore.set(getErpCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    await logAudit({
      userId: (user._id as any).toString(),
      action: "LOGIN",
      module: "AUTH",
      details: `User logged in successfully with role ${user.role}`,
    });

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}


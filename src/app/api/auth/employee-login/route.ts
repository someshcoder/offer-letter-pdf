import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAuthCookieName, signAuthToken } from "@/lib/auth";
import { handleApiError } from "@/lib/apiResponse";
import Employee from "@/models/Employee";
import LoginSession from "@/models/LoginSession";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string; mobileNumber?: string };
    const name = body.name?.trim();
    const mobileNumber = body.mobileNumber?.trim();

    if (!name || !mobileNumber) {
      return NextResponse.json(
        { error: "Name and mobile number are required" },
        { status: 400 },
      );
    }

    await connectDB();
    const employee = await Employee.findOne({
      employeeName: { $regex: `^${escapeRegExp(name)}$`, $options: "i" },
      mobileNumber,
      accessRole: { $in: ["Employee", "TL"] },
    })
      .select("_id employeeName email mobileNumber accessRole designation")
      .lean();

    if (!employee) {
      return NextResponse.json(
        { error: "Employee/TL not found. Check name and mobile number." },
        { status: 401 },
      );
    }

    const role = employee.accessRole === "TL" ? "TL" : "Employee";
    const session = await LoginSession.create({
      userId: String(employee._id),
      name: employee.employeeName,
      email: employee.email,
      mobileNumber: employee.mobileNumber,
      role,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    const token = signAuthToken({
      userId: String(employee._id),
      email: employee.email,
      role,
      name: employee.employeeName,
      sessionId: String(session._id),
    });

    const redirectTo = role === "TL" ? "/tl-dashboard" : "/sales/dashboard";
    const res = NextResponse.json({
      ok: true,
      redirectTo,
      user: {
        id: String(employee._id),
        email: employee.email,
        role,
        name: employee.employeeName,
      },
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

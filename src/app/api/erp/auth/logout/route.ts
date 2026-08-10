export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getErpCookieName } from "@/lib/erp/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getErpCookieName());

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}


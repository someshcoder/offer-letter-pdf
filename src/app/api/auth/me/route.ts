import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  const cookieUser = await getAuthFromCookies();
  const user = cookieUser
    ? {
        id: cookieUser.userId,
        email: cookieUser.email,
        role: cookieUser.role,
        name: cookieUser.name,
        sessionId: cookieUser.sessionId,
      }
    : null;
  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}

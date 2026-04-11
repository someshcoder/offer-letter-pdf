import { NextResponse } from "next/server";

export async function POST(req: Request) {
  void req;
  return NextResponse.json(
    {
      error:
        "Server-side email sending is disabled. Use the Send Email modal to open your mail app and attach the downloaded PDF.",
    },
    { status: 410 },
  );
}

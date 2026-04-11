import { NextResponse } from "next/server";
import mongoose from "mongoose";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  try {
    void req;
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    return NextResponse.json(
      {
        error:
          "Server-side email sending is disabled. Use the Send Email modal in the editor to open your mail app and attach the PDF.",
      },
      { status: 410 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Mail error";
    console.error("[mail] failed:", msg);
    return NextResponse.json({ error: msg, code: "MAIL_SEND_FAILED" }, { status: 500 });
  }
}

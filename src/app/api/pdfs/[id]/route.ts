import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import SavedPdf from "@/lib/models/SavedPdf";
import { normalizeDocumentKind } from "@/lib/formTypes";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(_req: Request, ctx: RouteContext<"/api/pdfs/[id]">) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    await connectDB();
    const doc = await SavedPdf.findById(id).select("-pdfBuffer").lean();
    if (!doc) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(doc._id),
      title: doc.title,
      documentKind: normalizeDocumentKind(doc.documentKind),
      form: doc.form,
      offsetX: doc.offsetX ?? 0,
      offsetY: doc.offsetY ?? 0,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    const issue = getMongoIssue(e);
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}

import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { buildEditedPdfFromBytes } from "@/lib/pdfEditor";
import type { FormFields } from "@/lib/formTypes";
import { normalizeDocumentKind } from "@/lib/formTypes";
import connectDB from "@/lib/mongodb";
import SavedPdf from "@/lib/models/SavedPdf";

export async function POST(req: Request) {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json(
      { error: "MONGODB_URI is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as {
      form?: FormFields;
      documentKind?: string;
      offsetX?: number;
      offsetY?: number;
      sendMail?: boolean;
      notifyEmail?: string;
    };

    const form = body.form;
    if (!form || typeof form !== "object") {
      return NextResponse.json({ error: "Missing form payload" }, { status: 400 });
    }

    const offsetX = Number(body.offsetX) || 0;
    const offsetY = Number(body.offsetY) || 0;
    const notifyEmail = body.notifyEmail?.trim() || form.email?.trim() || "";
    const sendMail = Boolean(body.sendMail && notifyEmail);
    const documentKind = normalizeDocumentKind(body.documentKind);

    await connectDB();

    const templatePath = path.join(process.cwd(), "public", "sample.pdf");
    const templateBytes = await readFile(templatePath);
    const pdf = await buildEditedPdfFromBytes(templateBytes, form, {
      offsetX,
      offsetY,
    });

    const title =
      [form.refNo, form.name].filter(Boolean).join(" · ") ||
      `PDF ${new Date().toISOString().slice(0, 10)}`;

    const doc = await SavedPdf.create({
      title: title.slice(0, 200),
      documentKind,
      form,
      offsetX,
      offsetY,
      pdfBuffer: Buffer.from(pdf),
      notifyEmail,
    });

    let mailSent = false;
    let mailError: string | undefined;

    if (sendMail) {
      mailError =
        "Server-side email sending is disabled. Use the Send Email modal to open your mail app and attach the PDF.";
      doc.mailError = mailError;
      await doc.save();
    }

    return NextResponse.json({
      id: String(doc._id),
      title: doc.title,
      mailSent,
      mailError,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const rows = await SavedPdf.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .select("-pdfBuffer")
      .lean();

    return NextResponse.json({
      items: rows.map((r) => ({
        id: String(r._id),
        title: r.title,
        documentKind: normalizeDocumentKind(r.documentKind),
        refNo: r.form?.refNo,
        name: r.form?.name,
        createdAt: r.createdAt,
        mailSentAt: r.mailSentAt,
        mailError: r.mailError,
        lastMailTo: r.lastMailTo,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import ErpInvoice from "@/models/erp/ErpInvoice";
import ErpProject from "@/models/erp/ErpProject";
import { logAudit } from "@/lib/erp/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "FRANCHISE" || !auth.franchiseId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectDB();
    const data = await ErpInvoice.find({ franchiseId: auth.franchiseId })
      .populate("projectId", "name budget")
      .populate("clientId", "name")
      .sort({ createdAt: -1 })
      .lean();
      
    return NextResponse.json({ success: true, data });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

function resolveClientId(project: { clientId?: unknown }): mongoose.Types.ObjectId | null {
  const raw = project.clientId as unknown;
  if (raw == null) return null;
  if (mongoose.isValidObjectId(raw)) return new mongoose.Types.ObjectId(String(raw));
  if (typeof raw === "object" && "_id" in (raw as object)) {
    const inner = (raw as { _id: unknown })._id;
    if (mongoose.isValidObjectId(inner)) return new mongoose.Types.ObjectId(String(inner));
  }
  return null;
}

function formatMongooseError(e: unknown): string {
  if (!e || typeof e !== "object") return "Unknown error";
  const err = e as {
    name?: string;
    message?: string;
    errors?: Record<string, { message?: string }>;
    errorResponse?: { errmsg?: string };
  };
  if (err.name === "ValidationError" && err.errors) {
    return Object.values(err.errors)
      .map((x) => x?.message)
      .filter(Boolean)
      .join("; ");
  }
  if (err.errorResponse?.errmsg) return err.errorResponse.errmsg;
  return err.message || "Unknown error";
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "FRANCHISE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.franchiseId) {
      return NextResponse.json({ error: "Franchise account is not linked" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const projectId = typeof body.projectId === "string" ? body.projectId.trim() : "";
    const { amount, tax = 0, dueDate } = body;

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return NextResponse.json({ error: "Valid project id is required" }, { status: 400 });
    }

    const amt = Number(amount);
    const tx = Number(tax ?? 0);
    if (!Number.isFinite(amt) || amt < 0 || !Number.isFinite(tx) || tx < 0) {
      return NextResponse.json({ error: "Amount and tax must be valid non-negative numbers" }, { status: 400 });
    }

    try {
      await connectDB();
    } catch (connErr) {
      const { message, status } = getMongoIssue(connErr);
      return NextResponse.json({ error: message }, { status });
    }

    const project = await ErpProject.findById(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (String(project.franchiseId) !== String(auth.franchiseId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clientId = resolveClientId(project);
    if (!clientId) {
      return NextResponse.json({ error: "Project is missing a valid client" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${randomBytes(4).toString("hex").toUpperCase()}`;

    const resolvedDue = dueDate ? new Date(dueDate as string | number) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(resolvedDue.getTime())) {
      return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
    }

    const invoice = await ErpInvoice.create({
      invoiceNumber,
      franchiseId: String(project.franchiseId),
      clientId: String(clientId),
      projectId: String(project._id),
      amount: amt,
      tax: tx,
      total: amt + tx,
      dueDate: resolvedDue,
      status: "Draft",
    });
    
    await logAudit({
      userId: auth.userId,
      action: "INVOICE_GENERATION",
      module: "INVOICES",
      details: `Generated bill ${invoiceNumber} for project ${project.name}`
    });

    const plain = await ErpInvoice.findById(invoice._id).lean();
    if (!plain) {
      return NextResponse.json({ error: "Invoice was created but could not be loaded" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: plain });
  } catch (e: any) {
    console.error("CRASH IN INVOICE POST:", e);
    if (e?.code === 11000) {
      return NextResponse.json({ error: "Duplicate invoice number; please try again" }, { status: 409 });
    }
    return NextResponse.json({ error: formatMongooseError(e) }, { status: 500 });
  }
}


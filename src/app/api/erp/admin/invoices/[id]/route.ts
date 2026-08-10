export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB from "@/lib/mongodb";
import ErpInvoice from "@/models/erp/ErpInvoice";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    const body = await req.json();
    const { status } = body; // "Approved" or "Paid" etc
    
    await connectDB();
    const invoice = await ErpInvoice.findByIdAndUpdate(id, { status }, { new: true });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    
    return NextResponse.json({ success: true, data: invoice });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

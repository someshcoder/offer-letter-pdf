export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB from "@/lib/mongodb";
import ErpInvoice from "@/models/erp/ErpInvoice";
import ErpFranchise from "@/models/erp/ErpFranchise";
import ErpClient from "@/models/erp/ErpClient";
import ErpProject from "@/models/erp/ErpProject";

export async function GET() {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await connectDB();
    const data = await ErpInvoice.find({})
      .populate("franchiseId", "businessName")
      .populate("clientId", "name")
      .populate("projectId", "name")
      .sort({ createdAt: -1 })
      .lean();
      
    return NextResponse.json({ success: true, data });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


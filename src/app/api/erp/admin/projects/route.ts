export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB from "@/lib/mongodb";
import ErpProject from "@/models/erp/ErpProject";
import { logAudit } from "@/lib/erp/audit";

export async function GET() {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const data = await ErpProject.find({})
      .populate("franchiseId", "businessName ownerName")
      .populate("clientId", "name")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// To Approve/Reject
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { projectId, status, adminApproval } = body;
    
    await connectDB();
    const updated = await ErpProject.findByIdAndUpdate(projectId, { status, adminApproval }, { new: true });
    
    await logAudit({
      userId: auth.userId,
      action: "PROJECT_MODIFICATION",
      module: "PROJECTS",
      details: `Changed project ${projectId} status to ${status}. Approval set to ${adminApproval}`
    });
    
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


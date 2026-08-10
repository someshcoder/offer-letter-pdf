export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB from "@/lib/mongodb";
import ErpProject from "@/models/erp/ErpProject";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "FRANCHISE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    const body = await req.json();
    const { currentProgress } = body;
    
    await connectDB();
    const project = await ErpProject.findOneAndUpdate(
      { _id: id, franchiseId: auth.franchiseId },
      { currentProgress: parseInt(currentProgress, 10) },
      { new: true }
    );
    
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: project });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

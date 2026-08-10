export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import ErpFranchise from "@/models/erp/ErpFranchise";
import ErpProject from "@/models/erp/ErpProject";
import ErpInvoice from "@/models/erp/ErpInvoice";
import ErpClient from "@/models/erp/ErpClient";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await connectDB();

    const [franchise, projects, invoices, totalClients] = await Promise.all([
      ErpFranchise.findById(id).lean(),
      ErpProject.find({ franchiseId: id }).sort({ createdAt: -1 }).lean(),
      ErpInvoice.find({ franchiseId: id, status: { $in: ["Approved", "Paid"] } }).lean().select("total"),
      ErpClient.countDocuments({ franchiseId: id })
    ]);

    if (!franchise) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    // Computed Aggregates
    const commPct = (franchise as any).commissionPercentage || 10;
    const totalRevenue = (invoices as any[]).reduce((sum, i) => sum + (i.total || 0), 0);
    const adminSlice = (totalRevenue * commPct) / 100;

    return NextResponse.json({
      success: true,
      data: {
        franchise,
        metrics: {
          totalClients,
          totalProjects: projects.length,
          grossRevenue: totalRevenue,
          calculatedCommission: adminSlice,
          commissionPct: commPct
        },
        projects
      }
    });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

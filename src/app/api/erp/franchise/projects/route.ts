export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB from "@/lib/mongodb";
import ErpProject from "@/models/erp/ErpProject";
import ErpInvoice from "@/models/erp/ErpInvoice";
import ErpPayment from "@/models/erp/ErpPayment";
import ErpFranchise from "@/models/erp/ErpFranchise";
import { logAudit } from "@/lib/erp/audit";
import {
  commissionOnGross,
  isPostApprovalProjectStatus,
  outstandingVsBudget,
  type ProjectFinancialSnapshot,
} from "@/lib/erp/projectFinancials";

export async function GET() {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "FRANCHISE" || !auth.franchiseId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const franchiseOid = new mongoose.Types.ObjectId(auth.franchiseId);

    const [franchise, projects] = await Promise.all([
      ErpFranchise.findById(auth.franchiseId).lean().select("commissionPercentage"),
      ErpProject.find({ franchiseId: auth.franchiseId })
        .populate("clientId", "name")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const commissionPct =
      typeof franchise?.commissionPercentage === "number" && franchise.commissionPercentage >= 0
        ? franchise.commissionPercentage
        : 10;

    const projectIds = projects.map((p) => p._id).filter(Boolean) as unknown as mongoose.Types.ObjectId[];
    let invoicedByProject = new Map<string, number>();
    let paidByProject = new Map<string, number>();

    if (projectIds.length > 0) {
      const [invoiceAgg, paymentAgg] = await Promise.all([
        ErpInvoice.aggregate<{ _id: mongoose.Types.ObjectId; totalInvoiced: number }>([
          {
            $match: {
              franchiseId: franchiseOid,
              projectId: { $in: projectIds },
              status: { $nin: ["Draft", "Cancelled"] },
            },
          },
          { $group: { _id: "$projectId", totalInvoiced: { $sum: "$total" } } },
        ]),
        ErpPayment.aggregate<{ _id: mongoose.Types.ObjectId; totalPaid: number }>([
          {
            $match: {
              franchiseId: franchiseOid,
              projectId: { $in: projectIds },
              status: "Verified",
            },
          },
          { $group: { _id: "$projectId", totalPaid: { $sum: "$amount" } } },
        ]),
      ]);

      invoicedByProject = new Map(
        invoiceAgg.map((r) => [String(r._id), r.totalInvoiced ?? 0]),
      );
      paidByProject = new Map(paymentAgg.map((r) => [String(r._id), r.totalPaid ?? 0]));
    }

    const data = projects.map((p) => {
      const pid = String(p._id);
      const gross = typeof p.budget === "number" ? p.budget : 0;
      let financials: ProjectFinancialSnapshot | null = null;

      if (isPostApprovalProjectStatus(String(p.status))) {
        const invoicedTotal = invoicedByProject.get(pid) ?? 0;
        const verifiedPaidTotal = paidByProject.get(pid) ?? 0;
        financials = {
          grossBudget: gross,
          commissionPct,
          commissionAmount: commissionOnGross(gross, commissionPct),
          invoicedTotal,
          verifiedPaidTotal,
          outstandingFromClient: outstandingVsBudget(gross, verifiedPaidTotal),
        };
      }

      return { ...p, financials };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "FRANCHISE" || !auth.franchiseId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, name, description, budget } = body;

    if (!clientId || !name || !budget) {
      return NextResponse.json({ error: "Client, name and budget required" }, { status: 400 });
    }

    await connectDB();

    const project = await ErpProject.create({
      franchiseId: auth.franchiseId,
      clientId,
      name,
      description,
      budget,
      status: "Pending",
      currentProgress: 0,
      adminApproval: false
    });

    await logAudit({
      userId: auth.userId,
      action: "CREATE_PROJECT",
      module: "PROJECT_MGMT",
      details: `Created project ${name} with budget ${budget}`,
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


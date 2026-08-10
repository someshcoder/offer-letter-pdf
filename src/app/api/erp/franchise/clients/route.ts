export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB from "@/lib/mongodb";
import ErpClient from "@/models/erp/ErpClient";
import { logAudit } from "@/lib/erp/audit";

export async function GET() {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "FRANCHISE" || !auth.franchiseId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const clients = await ErpClient.find({ franchiseId: auth.franchiseId }).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({ success: true, data: clients });
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
    const { name, email, phone, address } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    await connectDB();

    const client = await ErpClient.create({
      franchiseId: auth.franchiseId,
      name,
      email,
      phone,
      address
    });

    await logAudit({
      userId: auth.userId,
      action: "CREATE_CLIENT",
      module: "CLIENT_MGMT",
      details: `Created client ${name} (${phone})`,
    });

    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


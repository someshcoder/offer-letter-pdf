export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getErpAuth } from "@/lib/erp/auth";
import connectDB from "@/lib/mongodb";
import ErpFranchise from "@/models/erp/ErpFranchise";
import ErpUser from "@/models/erp/ErpUser";
import { logAudit } from "@/lib/erp/audit";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const franchises = await ErpFranchise.find({}).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({ success: true, data: franchises });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getErpAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      ownerName, email, phone, businessName, 
      location, commissionPercentage, password 
    } = body;

    if (!ownerName || !email || !password || !businessName || !phone) {
      return NextResponse.json({ error: "Missing required fields, including phone number" }, { status: 400 });
    }

    await connectDB();

    // Check duplication
    const existingUser = await ErpUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // 1. Create Franchise Entity
    const franchise = await ErpFranchise.create({
      ownerName,
      email: email.toLowerCase(),
      phone,
      businessName,
      location,
      commissionPercentage: commissionPercentage || 10
    });

    // 2. Create Auth Login for that Franchise
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const franchiseUser = await ErpUser.create({
      name: ownerName,
      email: email.toLowerCase(),
      passwordHash,
      role: "FRANCHISE",
      franchiseId: franchise._id,
      isActive: true
    });

    await logAudit({
      userId: auth.userId,
      action: "CREATE_FRANCHISE",
      module: "FRANCHISE_MGMT",
      details: `Created franchise ${businessName} tied to user ${franchiseUser.email}`,
    });

    return NextResponse.json({ 
      success: true, 
      data: { franchise, user: franchiseUser._id } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


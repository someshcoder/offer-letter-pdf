export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import ErpUser from "@/models/erp/ErpUser";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Check if target admin already exists
    const exists = await ErpUser.findOne({ email: "admin@gmail.com" });
    if (exists) {
      return NextResponse.json({ error: "Admin admin@gmail.com already configured" }, { status: 403 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("Admin@123", salt);

    await ErpUser.create({
      name: "System Admin",
      email: "admin@gmail.com",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });

    return NextResponse.json({
      message: "Initial admin created successfully.",
      credentials: {
        email: "admin@gmail.com",
        password: "Admin@123"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


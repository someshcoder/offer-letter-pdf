import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import User from "@/models/User";
import Employee from "@/models/Employee";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Name, email and password are required (password must be at least 6 characters)." },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const existingEmployee = await Employee.findOne({ email }).lean();
    if (existingEmployee) {
      return NextResponse.json({ error: "An employee with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      passwordHash,
      role: "TL",
    });

    const employee = await Employee.create({
      employeeName: name,
      mobileNumber: "0000000000",
      alternateNumber: "",
      email,
      designation: "Team Leader",
      role: "TL",
      accessRole: "TL",
      workingType: "Full Time",
      address: {
        currentAddress: "N/A",
        permanentAddress: "N/A",
        workingLocation: "N/A",
      },
      accountDetails: {
        accountHolderName: name,
        accountNumber: "0000000000",
        ifscCode: "ABCD0123456",
        bankName: "N/A",
        upiId: "",
        upiHolderName: "",
      },
      documents: {
        aadharNumber: "000000000000",
        panNumber: "",
        academicDocuments: [],
      },
    });

    return NextResponse.json({ item: { id: String(employee._id), name: employee.employeeName, email: employee.email } }, { status: 201 });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}

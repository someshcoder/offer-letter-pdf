import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import { employeeSchema } from "@/lib/employeeSchema";
import { readEmployeeValuesFromFormData } from "@/lib/employeePayload";
import { saveUploadedFile } from "@/utils/upload";
import { mapEmployee } from "@/lib/employeeMapper";
import { getAuthFromCookies } from "@/lib/auth";
import Employee from "@/models/Employee";
import { unassignedEmployeeFilter } from "@/lib/tlAssignment";

export async function GET(_req: Request) {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({
      items: [],
      warning: "MONGODB_URI is not configured. Employee list is empty.",
    });
  }

  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const query: any = {};
    const url = new URL(_req.url || "", "http://localhost");
    const filter = url.searchParams.get("filter");
    const lite = url.searchParams.get("lite") === "1";
    const limitParam = Number(url.searchParams.get("limit") || 0);
    const limit = limitParam > 0 ? Math.min(500, limitParam) : undefined;

    if (auth.role === "TL") {
      query["reportingTL.email"] = auth.email;
    } else if (filter === "unassigned") {
      Object.assign(query, unassignedEmployeeFilter());
    }

    let dbQuery = Employee.find(query).sort({ createdAt: -1 });
    if (lite) {
      dbQuery = dbQuery.select(
        "_id employeeName mobileNumber email designation role accessRole offeredSalary reportingTL createdAt updatedAt",
      );
    } else {
      dbQuery = dbQuery.select(
        "-documents.aadharFile -documents.panCardFile -documents.academicDocuments -documents.experienceLetter -documents.passportPhoto -documents.passbookFile",
      );
    }
    if (limit) dbQuery = dbQuery.limit(limit);

    const rows = await dbQuery.lean();
    return NextResponse.json({
      items: rows.map((row) => mapEmployee(row)),
    });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({
      items: [],
      warning: issue.message,
    });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const formData = await req.formData();
    const parsed = employeeSchema.safeParse(readEmployeeValuesFromFormData(formData));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const values = parsed.data;

    const created = await Employee.create({
      employeeName: values.employeeName,
      mobileNumber: values.mobileNumber,
      alternateNumber: values.alternateNumber || "",
      email: values.email,
      designation: values.designation,
      role: values.role,
      accessRole: values.accessRole,
      workingType: values.workingType,
      workingMode: values.workingMode,
      officeLocation: values.officeLocation || "",
      dob: values.dob,
      maritalStatus: values.maritalStatus,
      bloodGroup: values.bloodGroup || "",
      offeredSalary: values.offeredSalary || 0,
      interviewDate: values.interviewDate || "",
      joiningDate: values.joiningDate,
      relationType: values.relationType,
      relativeName: values.relativeName,
      address: {
        currentAddress: values.currentAddress,
        permanentAddress: values.permanentAddress,
      },
      accountDetails: {
        accountHolderName: values.accountHolderName,
        accountNumber: values.accountNumber,
        ifscCode: values.ifscCode,
        bankName: values.bankName,
        upiId: values.upiId || "",
        upiHolderName: values.upiHolderName || "",
      },
      documents: {
        aadharNumber: values.aadharNumber,
        panNumber: values.panNumber || "",
        academicDocuments: [],
      },
      reportingTL: values.reportingTLId ? {
        id: values.reportingTLId,
        employeeName: values.reportingTLName || "",
        email: values.reportingTLEmail || "",
      } : undefined,
    });

    const employeeId = String(created._id);

    const aadharFile = formData.get("aadharFile");
    if (aadharFile instanceof File && aadharFile.size > 0) {
      created.documents.aadharFile = await saveUploadedFile(
        aadharFile,
        employeeId,
        "aadhar",
      );
    }

    const panCardFile = formData.get("panCardFile");
    if (panCardFile instanceof File && panCardFile.size > 0) {
      created.documents.panCardFile = await saveUploadedFile(
        panCardFile,
        employeeId,
        "pan",
      );
    }

    const academicDocuments = formData.getAll("academicDocuments");
    const uploadedAcademics = [];
    for (const item of academicDocuments) {
      if (item instanceof File && item.size > 0) {
        uploadedAcademics.push(
          await saveUploadedFile(item, employeeId, "academic"),
        );
      }
    }
    created.documents.academicDocuments = uploadedAcademics;

    const experienceLetter = formData.get("experienceLetter");
    if (experienceLetter instanceof File && experienceLetter.size > 0) {
      created.documents.experienceLetter = await saveUploadedFile(
        experienceLetter,
        employeeId,
        "experience",
      );
    }

    const passportPhoto = formData.get("passportPhoto");
    if (passportPhoto instanceof File && passportPhoto.size > 0) {
      created.documents.passportPhoto = await saveUploadedFile(
        passportPhoto,
        employeeId,
        "photo",
      );
    }

    const passbookFile = formData.get("passbookFile");
    if (passbookFile instanceof File && passbookFile.size > 0) {
      created.documents.passbookFile = await saveUploadedFile(
        passbookFile,
        employeeId,
        "passbook",
      );
    }

    await created.save();
    const fresh = await Employee.findById(employeeId).lean();

    return NextResponse.json(
      { item: fresh ? mapEmployee(fresh) : null },
      { status: 201 },
    );
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}

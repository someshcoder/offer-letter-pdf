import { NextResponse } from "next/server";
import connectDB, { getMongoIssue } from "@/lib/mongodb";
import { employeeSchema } from "@/lib/employeeSchema";
import { readEmployeeValuesFromFormData } from "@/lib/employeePayload";
import { saveUploadedFile } from "@/utils/upload";
import { mapEmployee } from "@/lib/employeeMapper";
import { getAuthFromCookies } from "@/lib/auth";
import Employee from "@/models/Employee";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/employees/[id]">,
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await ctx.params;
    const row = await Employee.findById(id).lean();

    if (!row) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Security check: TL only sees their employees
    if (auth.role === "TL" && row.reportingTL?.email !== auth.email) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    return NextResponse.json({ item: mapEmployee(row) });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}

export async function PUT(
  req: Request,
  ctx: RouteContext<"/api/employees/[id]">,
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await ctx.params;

    const existing = await Employee.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Security check: TL only updates their employees
    if (auth.role === "TL" && existing.reportingTL?.email !== auth.email) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const formData = await req.formData();
    const parsed = employeeSchema.safeParse(readEmployeeValuesFromFormData(formData));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const values = parsed.data;
    existing.employeeName = values.employeeName;
    existing.mobileNumber = values.mobileNumber;
    existing.alternateNumber = values.alternateNumber || "";
    existing.email = values.email;
    existing.designation = values.designation;
    existing.role = values.role;
    existing.accessRole = values.accessRole;
    existing.workingType = values.workingType;
    existing.workingMode = values.workingMode;
    existing.officeLocation = values.officeLocation || "";
    existing.dob = values.dob;
    existing.maritalStatus = values.maritalStatus;
    existing.bloodGroup = values.bloodGroup || "";
    existing.offeredSalary = values.offeredSalary || 0;
    existing.interviewDate = values.interviewDate || "";
    existing.joiningDate = values.joiningDate;
    existing.relationType = values.relationType;
    existing.relativeName = values.relativeName;
    existing.address = {
      currentAddress: values.currentAddress,
      permanentAddress: values.permanentAddress,
    };
    existing.accountDetails = {
      accountHolderName: values.accountHolderName,
      accountNumber: values.accountNumber,
      ifscCode: values.ifscCode,
      bankName: values.bankName,
      upiId: values.upiId || "",
      upiHolderName: values.upiHolderName || "",
    };
    existing.documents.aadharNumber = values.aadharNumber;
    existing.documents.panNumber = values.panNumber || "";

    if (values.reportingTLId) {
      existing.reportingTL = {
        id: values.reportingTLId,
        employeeName: values.reportingTLName || "",
        email: values.reportingTLEmail || "",
      };
    } else {
      existing.reportingTL = undefined;
    }

    const employeeId = String(existing._id);

    const aadharFile = formData.get("aadharFile");
    if (aadharFile instanceof File && aadharFile.size > 0) {
      existing.documents.aadharFile = await saveUploadedFile(
        aadharFile,
        employeeId,
        "aadhar",
      );
    }

    const panCardFile = formData.get("panCardFile");
    if (panCardFile instanceof File && panCardFile.size > 0) {
      existing.documents.panCardFile = await saveUploadedFile(
        panCardFile,
        employeeId,
        "pan",
      );
    }

    const academicDocuments = formData.getAll("academicDocuments");
    if (academicDocuments.length > 0) {
      const uploadedAcademics = [];
      for (const item of academicDocuments) {
        if (item instanceof File && item.size > 0) {
          uploadedAcademics.push(await saveUploadedFile(item, employeeId, "academic"));
        }
      }
      if (uploadedAcademics.length > 0) {
        existing.documents.academicDocuments = uploadedAcademics;
      }
    }

    const experienceLetter = formData.get("experienceLetter");
    if (experienceLetter instanceof File && experienceLetter.size > 0) {
      existing.documents.experienceLetter = await saveUploadedFile(
        experienceLetter,
        employeeId,
        "experience",
      );
    }

    const passportPhoto = formData.get("passportPhoto");
    if (passportPhoto instanceof File && passportPhoto.size > 0) {
      existing.documents.passportPhoto = await saveUploadedFile(
        passportPhoto,
        employeeId,
        "photo",
      );
    }

    const passbookFile = formData.get("passbookFile");
    if (passbookFile instanceof File && passbookFile.size > 0) {
      existing.documents.passbookFile = await saveUploadedFile(
        passbookFile,
        employeeId,
        "passbook",
      );
    }

    await existing.save();
    const updated = await Employee.findById(id).lean();

    return NextResponse.json({ item: updated ? mapEmployee(updated) : null });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/employees/[id]">,
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await ctx.params;

    // Check existing before deleting for permission check
    const existing = await Employee.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Security check: TL only deletes their employees
    if (auth.role === "TL" && existing.reportingTL?.email !== auth.email) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await Employee.findByIdAndDelete(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const issue = getMongoIssue(error);
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import connectDB from "@/lib/mongodb";
import CompanySettings from "@/models/CompanySettings";
import { saveUploadedFile } from "@/utils/upload";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    let settings = await CompanySettings.findOne().lean();
    if (!settings) {
      settings = await CompanySettings.create({});
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || (auth.role !== "Admin" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const formData = await req.formData();
    
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings({});
    }

    const companyName = formData.get("companyName") as string;
    const companyEmail = formData.get("companyEmail") as string;
    const companyMobile = formData.get("companyMobile") as string;
    const companyWebsite = formData.get("companyWebsite") as string;
    const companyAddress = formData.get("companyAddress") as string;

    if (companyName !== null) settings.companyName = companyName;
    if (companyEmail !== null) settings.companyEmail = companyEmail;
    if (companyMobile !== null) settings.companyMobile = companyMobile;
    if (companyWebsite !== null) settings.companyWebsite = companyWebsite;
    if (companyAddress !== null) settings.companyAddress = companyAddress;

    const logoFile = formData.get("companyLogo") as File;
    if (logoFile && logoFile.size > 0) {
      const uploaded = await saveUploadedFile(logoFile, "company", "logo");
      settings.companyLogo = { url: uploaded.url, fileName: uploaded.fileName };
    }

    const directorSignFile = formData.get("directorSignature") as File;
    if (directorSignFile && directorSignFile.size > 0) {
      const uploaded = await saveUploadedFile(directorSignFile, "company", "director-sign");
      settings.directorSignature = { url: uploaded.url, fileName: uploaded.fileName };
    }

    const seniorHrSignFile = formData.get("seniorHrSignature") as File;
    if (seniorHrSignFile && seniorHrSignFile.size > 0) {
      const uploaded = await saveUploadedFile(seniorHrSignFile, "company", "senior-hr-sign");
      settings.seniorHrSignature = { url: uploaded.url, fileName: uploaded.fileName };
    }

    await settings.save();
    revalidateTag("company-settings", "max");
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

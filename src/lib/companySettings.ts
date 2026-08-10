import { unstable_cache } from "next/cache";
import connectDB from "@/lib/mongodb";
import CompanySettings from "@/models/CompanySettings";

export type CompanyBranding = {
  companyName: string;
  companyLogo: string | null;
};

async function loadCompanySettings(): Promise<CompanyBranding> {
  if (!process.env.MONGODB_URI) {
    return { companyName: "ProvisioningTech", companyLogo: "/logo.png" };
  }
  try {
    await connectDB();
    const settings = await CompanySettings.findOne()
      .select("companyName companyLogo")
      .lean();
    return {
      companyName: settings?.companyName || "ProvisioningTech",
      companyLogo: settings?.companyLogo?.url || "/logo.png",
    };
  } catch {
    return { companyName: "ProvisioningTech", companyLogo: "/logo.png" };
  }
}

export const getCompanySettings = unstable_cache(
  loadCompanySettings,
  ["company-settings-v1"],
  { revalidate: 300, tags: ["company-settings"] },
);

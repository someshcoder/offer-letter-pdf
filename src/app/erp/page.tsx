import { redirect } from "next/navigation";
import { getErpAuth } from "@/lib/erp/auth";

export default async function ErpIndexPage() {
  const auth = await getErpAuth();
  
  if (!auth) {
    redirect("/erp/login");
  }
  
  if (auth.role === "ADMIN") {
    redirect("/erp/admin");
  } else {
    redirect("/erp/franchise");
  }
  
  return null;
}

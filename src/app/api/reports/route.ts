import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import Employee from "@/models/Employee";
import Client from "@/models/Client";
import Lead from "@/models/modules/Lead";
import Project from "@/models/modules/Project";
import StaffExpense from "@/models/modules/StaffExpense";
import OfficeExpense from "@/models/modules/OfficeExpense";
import CompanyAsset from "@/models/modules/CompanyAsset";
import Renewal from "@/models/modules/Renewal";
import MarketingPayment from "@/models/modules/MarketingPayment";
import MaintenanceService from "@/models/modules/MaintenanceService";
import SalaryRecord from "@/models/modules/SalaryRecord";
import StaffAllocation from "@/models/modules/StaffAllocation";
import { PaymentHistory } from "@/models/modules/MarketingPayment";

const REPORT_MAP: Record<string, () => Promise<unknown[]>> = {
  staff: async () => {
    await connectDB();
    return Employee.find({}).select("employeeName email designation accessRole joiningDate").lean();
  },
  customer: async () => {
    await connectDB();
    return Client.find({ deletedAt: null }).lean();
  },
  sales: async () => {
    await connectDB();
    return Lead.find({ deletedAt: null }).lean();
  },
  expense: async () => {
    await connectDB();
    const [staff, office] = await Promise.all([
      StaffExpense.find({ deletedAt: null }).lean(),
      OfficeExpense.find({ deletedAt: null }).lean(),
    ]);
    return [...staff.map((s) => ({ ...s, type: "staff" })), ...office.map((o) => ({ ...o, type: "office" }))];
  },
  salary: async () => {
    await connectDB();
    return SalaryRecord.find({ deletedAt: null }).lean();
  },
  assets: async () => {
    await connectDB();
    return CompanyAsset.find({ deletedAt: null }).lean();
  },
  renewals: async () => {
    await connectDB();
    return Renewal.find({ deletedAt: null }).lean();
  },
  payments: async () => {
    await connectDB();
    return MarketingPayment.find({ deletedAt: null }).lean();
  },
  "payment-ledger": async () => {
    await connectDB();
    const [payments, histories, salaries, staffExpenses] = await Promise.all([
      MarketingPayment.find({ deletedAt: null }).lean(),
      PaymentHistory.find({}).lean(),
      SalaryRecord.find({ deletedAt: null }).lean(),
      StaffExpense.find({ deletedAt: null }).lean(),
    ]);
    return [
      ...payments.map((p) => ({ ...p, ledgerType: "customer_invoice" })),
      ...histories.map((h) => ({ ...h, ledgerType: "payment_received" })),
      ...salaries.map((s) => ({ ...s, ledgerType: "salary_outgoing" })),
      ...staffExpenses.map((e) => ({ ...e, ledgerType: "staff_expense_outgoing" })),
    ];
  },
  maintenance: async () => {
    await connectDB();
    return MaintenanceService.find({ deletedAt: null }).lean();
  },
  projects: async () => {
    await connectDB();
    return Project.find({ deletedAt: null }).lean();
  },
  allocations: async () => {
    await connectDB();
    return StaffAllocation.find({ isActive: true }).lean();
  },
};

export async function GET(request: Request) {
  const auth = await requireModuleAuth("report");
  if ("error" in auth) return auth.error;

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "customer";
    const format = url.searchParams.get("format") || "json";

    const generator = REPORT_MAP[type];
    if (!generator) return jsonError("Invalid report type", 400);

    const data = await generator();
    const mapped = (data as Array<{ _id?: unknown }>).map((row) => ({
      ...row,
      _id: row._id ? String(row._id) : undefined,
    }));

    if (format === "csv") {
      if (!mapped.length) {
        return new NextResponse("No data", { headers: { "Content-Type": "text/csv" } });
      }
      const keys = Object.keys(mapped[0] as object);
      const csv = [keys.join(","), ...mapped.map((row) => keys.map((k) => JSON.stringify((row as Record<string, unknown>)[k] ?? "")).join(","))].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-report.csv"`,
        },
      });
    }

    return NextResponse.json({ type, count: mapped.length, items: mapped });
  } catch (error) {
    return handleApiError(error);
  }
}

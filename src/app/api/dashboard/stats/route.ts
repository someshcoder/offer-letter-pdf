import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError } from "@/lib/apiResponse";
import { requireAuth } from "@/lib/apiAuth";
import Employee from "@/models/Employee";
import Client from "@/models/Client";
import Lead from "@/models/modules/Lead";
import Project from "@/models/modules/Project";
import MarketingPayment from "@/models/modules/MarketingPayment";
import MaintenanceService from "@/models/modules/MaintenanceService";
import Renewal from "@/models/modules/Renewal";
import Domain from "@/models/modules/Domain";
import StaffExpense from "@/models/modules/StaffExpense";
import OfficeExpense from "@/models/modules/OfficeExpense";
import CompanyAsset from "@/models/modules/CompanyAsset";
import Task from "@/models/modules/Task";
import SalaryRecord from "@/models/modules/SalaryRecord";

const CACHE_TTL_MS = 60_000;
let statsCache: { payload: unknown; expiresAt: number } | null = null;

export async function GET() {
  const auth = await requireAuth(["Admin", "HR"]);
  if ("error" in auth) return auth.error;

  const nowMs = Date.now();
  if (statsCache && statsCache.expiresAt > nowMs) {
    return NextResponse.json(statsCache.payload, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  }

  try {
    await connectDB();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const in30Days = new Date(now.getTime() + 30 * 86400000);
    const notDeleted = { deletedAt: null };

    const [
      totalStaff,
      totalCustomers,
      activeCustomers,
      activeProjects,
      completedProjects,
      pendingPayments,
      monthlyRevenue,
      officeExpenses,
      staffExpenses,
      assets,
      renewals,
      domainExpiry,
      maintenanceCustomers,
      monthlyServices,
      totalLeads,
      convertedLeads,
      pendingTasks,
      upcomingRenewals,
      leadsByStatus,
      projectsByStatus,
      expensesByCategory,
      salaryByMonth,
    ] = await Promise.all([
      Employee.estimatedDocumentCount(),
      Client.countDocuments(notDeleted),
      Client.countDocuments({ ...notDeleted, status: { $in: ["Work in Progress", "Completed (Live)"] } }),
      Project.countDocuments({ ...notDeleted, status: { $in: ["In Progress", "Staff Assigned"] } }),
      Project.countDocuments({ ...notDeleted, status: "Completed" }),
      MarketingPayment.countDocuments({ ...notDeleted, status: { $in: ["Pending", "Partial", "Overdue"] } }),
      MarketingPayment.aggregate([
        { $match: { ...notDeleted, createdAt: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]),
      OfficeExpense.aggregate([
        { $match: { ...notDeleted, expenseDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      StaffExpense.aggregate([
        { $match: { ...notDeleted, expenseDate: { $gte: monthStart, $lte: monthEnd }, status: "Approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CompanyAsset.countDocuments(notDeleted),
      Renewal.countDocuments({ ...notDeleted, paymentStatus: { $in: ["Upcoming", "Due"] } }),
      Domain.countDocuments({ ...notDeleted, expiryDate: { $lte: in30Days } }),
      MaintenanceService.countDocuments({ ...notDeleted, status: "Active" }),
      MaintenanceService.countDocuments({ ...notDeleted, serviceType: "Monthly Service", status: "Active" }),
      Lead.countDocuments(notDeleted),
      Lead.countDocuments({ ...notDeleted, status: "Closed" }),
      Task.countDocuments({ ...notDeleted, status: { $in: ["Pending", "In Progress", "Overdue"] } }),
      Renewal.countDocuments({ ...notDeleted, renewalDate: { $gte: now, $lte: in30Days } }),
      Lead.aggregate([{ $match: notDeleted }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Project.aggregate([{ $match: notDeleted }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      OfficeExpense.aggregate([
        { $match: { ...notDeleted, expenseDate: { $gte: monthStart } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
      ]),
      SalaryRecord.aggregate([
        { $match: { ...notDeleted, year: now.getFullYear() } },
        { $group: { _id: "$month", total: { $sum: "$netSalary" } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const payload = {
      cards: {
        totalStaff,
        totalCustomers,
        activeCustomers,
        activeProjects,
        completedProjects,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        pendingPayments,
        officeExpenses: officeExpenses[0]?.total || 0,
        staffExpenses: staffExpenses[0]?.total || 0,
        assets,
        renewals,
        domainExpiry,
        maintenanceCustomers,
        totalLeads,
        convertedLeads,
        pendingTasks,
        upcomingRenewals,
        monthlyServices,
      },
      charts: {
        leadsByStatus,
        projectsByStatus,
        expensesByCategory,
        salaryByMonth,
      },
    };

    statsCache = { payload, expiresAt: nowMs + CACHE_TTL_MS };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

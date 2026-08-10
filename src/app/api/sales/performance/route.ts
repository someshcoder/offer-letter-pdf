import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireAuth } from "@/lib/apiAuth";
import {
  buildPrizeProgress,
  buildTeamPerformance,
  computeSalesStats,
} from "@/lib/modules/salesPerformance";

export async function GET(request: Request) {
  const auth = await requireAuth(["Admin", "HR", "TL", "Employee"]);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const url = new URL(request.url);
    const requestedEmployeeId = url.searchParams.get("employeeId");
    const scope = url.searchParams.get("scope") || "me"; // me | team

    const isManager = auth.user.role === "Admin" || auth.user.role === "HR" || auth.user.role === "TL";

    if (scope === "team") {
      if (!isManager) return jsonError("Forbidden", 403);
      const team = await buildTeamPerformance();
      return NextResponse.json({
        scope: "team",
        team,
        summary: {
          people: team.length,
          totalCustomers: team.reduce((s, r) => s + r.stats.customers, 0),
          totalPaymentsReceived: team.reduce((s, r) => s + r.stats.paymentsReceived, 0),
          totalSalesValue: team.reduce((s, r) => s + r.stats.salesValue, 0),
          totalDue: team.reduce((s, r) => s + r.stats.paymentsDue, 0),
          totalPrizesAchieved: team.reduce((s, r) => s + r.prizesAchieved, 0),
        },
      });
    }

    // personal / single employee
    let employeeId = auth.user.userId;
    if (requestedEmployeeId) {
      if (!isManager && requestedEmployeeId !== auth.user.userId) {
        return jsonError("You can only view your own sales performance", 403);
      }
      employeeId = requestedEmployeeId;
    }

    const [stats, prizes, monthlyStats] = await Promise.all([
      computeSalesStats(employeeId, "all_time"),
      buildPrizeProgress(employeeId),
      computeSalesStats(employeeId, "monthly"),
    ]);

    return NextResponse.json({
      scope: "me",
      employeeId,
      employeeName: auth.user.name || "",
      stats,
      monthlyStats,
      prizes,
      prizesAchieved: prizes.filter((p) => p.achieved).length,
      prizesTotal: prizes.length,
      nextPrize: prizes.find((p) => !p.achieved) || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

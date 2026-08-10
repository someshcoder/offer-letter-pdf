import Client from "@/models/Client";
import Lead from "@/models/modules/Lead";
import MarketingPayment from "@/models/modules/MarketingPayment";
import SalesPrize, {
  PRIZE_METRIC_LABELS,
  type PrizeMetric,
  type PrizePeriod,
} from "@/models/modules/SalesPrize";
import Employee from "@/models/Employee";

export type SalesStats = {
  customers: number;
  leads: number;
  convertedLeads: number;
  salesValue: number;
  paymentsReceived: number;
  paymentsDue: number;
};

export type PrizeProgress = {
  _id: string;
  title: string;
  description: string;
  reward: string;
  metric: PrizeMetric;
  metricLabel: string;
  targetValue: number;
  period: PrizePeriod;
  currentValue: number;
  remaining: number;
  progressPercent: number;
  achieved: boolean;
};

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function computeSalesStats(
  employeeId: string,
  period: PrizePeriod = "all_time",
): Promise<SalesStats> {
  const dateFilter =
    period === "monthly" ? { createdAt: { $gte: monthStart() } } : {};

  const clientFilter = {
    assignedStaffId: employeeId,
    deletedAt: null,
    ...dateFilter,
  };

  const clientIds = (
    await Client.find({ assignedStaffId: employeeId, deletedAt: null })
      .select("_id")
      .lean()
  ).map((c) => c._id);

  const [customers, leads, convertedLeads, paymentAgg] = await Promise.all([
    Client.countDocuments(clientFilter),
    Lead.countDocuments({
      assignedTo: employeeId,
      deletedAt: null,
      ...dateFilter,
    }),
    Lead.countDocuments({
      assignedTo: employeeId,
      deletedAt: null,
      $or: [{ status: "Closed" }, { convertedClientId: { $ne: null } }],
      ...dateFilter,
    }),
    clientIds.length
      ? MarketingPayment.aggregate([
          {
            $match: {
              clientId: { $in: clientIds },
              deletedAt: null,
              ...(period === "monthly"
                ? { createdAt: { $gte: monthStart() } }
                : {}),
            },
          },
          {
            $group: {
              _id: null,
              salesValue: { $sum: "$totalAmount" },
              paymentsReceived: { $sum: "$paidAmount" },
              paymentsDue: { $sum: "$dueAmount" },
            },
          },
        ])
      : Promise.resolve([]),
  ]);

  const pay = paymentAgg[0] || {
    salesValue: 0,
    paymentsReceived: 0,
    paymentsDue: 0,
  };

  return {
    customers,
    leads,
    convertedLeads,
    salesValue: Number(pay.salesValue) || 0,
    paymentsReceived: Number(pay.paymentsReceived) || 0,
    paymentsDue: Number(pay.paymentsDue) || 0,
  };
}

function metricValue(stats: SalesStats, metric: PrizeMetric): number {
  switch (metric) {
    case "customers":
      return stats.customers;
    case "leads":
      return stats.leads;
    case "converted_leads":
      return stats.convertedLeads;
    case "sales_value":
      return stats.salesValue;
    case "payments_received":
      return stats.paymentsReceived;
    default:
      return 0;
  }
}

export async function buildPrizeProgress(
  employeeId: string,
): Promise<PrizeProgress[]> {
  const prizes = await SalesPrize.find({ deletedAt: null, isActive: true })
    .sort({ sortOrder: 1, targetValue: 1 })
    .lean();

  if (!prizes.length) return [];

  const [allTimeStats, monthlyStats] = await Promise.all([
    computeSalesStats(employeeId, "all_time"),
    prizes.some((p) => p.period === "monthly")
      ? computeSalesStats(employeeId, "monthly")
      : Promise.resolve(null),
  ]);

  return prizes.map((prize) => {
    const metric = prize.metric as PrizeMetric;
    const period = (prize.period || "all_time") as PrizePeriod;
    const stats =
      period === "monthly" && monthlyStats ? monthlyStats : allTimeStats;
    const currentValue = metricValue(stats, metric);
    const targetValue = Number(prize.targetValue) || 0;
    const remaining = Math.max(0, targetValue - currentValue);
    const progressPercent =
      targetValue > 0
        ? Math.min(100, Math.round((currentValue / targetValue) * 100))
        : 0;

    return {
      _id: String(prize._id),
      title: prize.title,
      description: prize.description || "",
      reward: prize.reward,
      metric,
      metricLabel: PRIZE_METRIC_LABELS[metric] || metric,
      targetValue,
      period,
      currentValue,
      remaining,
      progressPercent,
      achieved: currentValue >= targetValue,
    };
  });
}

export async function listSalesEmployeeIds(): Promise<
  Array<{ id: string; name: string }>
> {
  const [assignedClients, assignedLeads, employeeRole] = await Promise.all([
    Client.distinct("assignedStaffId", {
      assignedStaffId: { $ne: null },
      deletedAt: null,
    }),
    Lead.distinct("assignedTo", {
      assignedTo: { $nin: ["", null] },
      deletedAt: null,
    }),
    Employee.find({ accessRole: "Employee" })
      .select("_id employeeName")
      .lean()
      .catch(() => []),
  ]);

  const idSet = new Set<string>();
  for (const id of assignedClients) {
    if (id) idSet.add(String(id));
  }
  for (const id of assignedLeads) {
    if (id) idSet.add(String(id));
  }
  for (const emp of employeeRole as Array<{ _id: unknown; employeeName?: string }>) {
    idSet.add(String(emp._id));
  }

  if (!idSet.size) return [];

  const employees = await Employee.find({
    _id: { $in: Array.from(idSet) },
  })
    .select("_id employeeName")
    .lean();

  const nameMap = new Map(
    employees.map((e) => [String(e._id), e.employeeName || "Employee"]),
  );

  // Include ids even if employee master missing
  return Array.from(idSet)
    .map((id) => ({ id, name: nameMap.get(id) || "Sales User" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function buildTeamPerformance() {
  const people = await listSalesEmployeeIds();
  const rows = await Promise.all(
    people.map(async (person) => {
      const [stats, prizes] = await Promise.all([
        computeSalesStats(person.id, "all_time"),
        buildPrizeProgress(person.id),
      ]);
      const achieved = prizes.filter((p) => p.achieved).length;
      return {
        employeeId: person.id,
        employeeName: person.name,
        stats,
        prizesAchieved: achieved,
        prizesTotal: prizes.length,
        nextPrize: prizes.find((p) => !p.achieved) || null,
        prizes,
      };
    }),
  );

  rows.sort(
    (a, b) =>
      b.stats.paymentsReceived - a.stats.paymentsReceived ||
      b.stats.salesValue - a.stats.salesValue,
  );
  return rows;
}

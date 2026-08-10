import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Client from "@/models/Client";
import { handleApiError, jsonError } from "@/lib/apiResponse";
import { requireAuth } from "@/lib/apiAuth";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import {
  clientPayloadSchema,
  mapClientPayload,
  mapClientListItem,
  mapClientDetail,
} from "@/lib/clients";
import {
  parseListQuery,
  buildSoftDeleteFilter,
  buildSearchFilter,
  buildSort,
  paginated,
  skip,
} from "@/lib/modules/query";

export async function GET(request: Request) {
  const auth = await requireAuth(["Admin", "HR", "TL", "Employee"]);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const url = new URL(request.url);
    const lite = url.searchParams.get("lite") === "1";

    if (lite) {
      const liteFilter: Record<string, unknown> = { ...buildSoftDeleteFilter(false) };
      if (auth.user.role === "Employee") {
        liteFilter.assignedStaffId = auth.user.userId;
      }
      
      const items = await Client.find(liteFilter)
        .select("_id name mobileNumber status domainDetails.businessName")
        .sort({ name: 1 })
        .limit(500)
        .lean();
      return NextResponse.json({
        items: items.map((doc) => ({
          _id: String(doc._id),
          name: doc.name,
          mobileNumber: doc.mobileNumber,
          status: doc.status,
          companyName: doc.domainDetails?.businessName || "",
        })),
      });
    }

    const q = parseListQuery(request.url);
    const searchFilter = buildSearchFilter(q.search || "", [
      "name",
      "mobileNumber",
      "email",
      "city",
      "customerNotes",
      "assignedStaffName",
    ]);

    const filter: Record<string, unknown> = {
      ...buildSoftDeleteFilter(q.includeDeleted || false),
    };

    if (auth.user.role === "Employee") {
      filter.assignedStaffId = auth.user.userId;
    }

    if (searchFilter.$or) {
      filter.$and = [{ $or: searchFilter.$or }];
    }

    if (q.status && q.status !== "All") filter.status = q.status;

    const staffId = url.searchParams.get("staffId");
    if (staffId === "unassigned") {
      const unassignedClause = {
        $or: [
          { assignedStaffId: null },
          { assignedStaffId: { $exists: false } },
          { assignedStaffName: { $in: ["", null] } },
        ],
      };
      filter.$and = [...((filter.$and as unknown[]) || []), unassignedClause];
    } else if (staffId) {
      filter.assignedStaffId = staffId;
    }

    const [total, items, statusCounts] = await Promise.all([
      Client.countDocuments(filter),
      Client.find(filter)
        .select(
          "name mobileNumber email city state address status customerNotes assignedStaffId assignedStaffName domainDetails.businessName createdAt updatedAt",
        )
        .sort(buildSort(q.sortBy || "createdAt", q.sortOrder))
        .skip(skip(q.page, q.limit))
        .limit(q.limit)
        .lean(),
      Client.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total: statusCounts.reduce((sum, row) => sum + row.count, 0),
      live: statusCounts.find((r) => r._id === "Completed (Live)")?.count || 0,
      inProgress: statusCounts.find((r) => r._id === "Work in Progress")?.count || 0,
      pending: statusCounts.find((r) => r._id === "Pending")?.count || 0,
    };

    return NextResponse.json({
      ...paginated(items.map(mapClientListItem), q.page, q.limit, total),
      stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireModuleAuth("customer");
  if ("error" in auth) return auth.error;

  try {
    const payload = await request.json();
    const parsed = clientPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonError("Invalid customer data", 400);
    }

    await connectDB();
    const newClient = await Client.create({
      ...mapClientPayload(parsed.data),
      createdBy: auth.user.userId,
      updatedBy: auth.user.userId,
    });
    return NextResponse.json(mapClientDetail(newClient.toObject() as Record<string, unknown>), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

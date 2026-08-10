import type { ListQueryParams, PaginatedResponse, PaginationMeta } from "@/types/modules/common";

export function parseListQuery(url: string): Required<
  Pick<ListQueryParams, "page" | "limit" | "sortOrder">
> &
  ListQueryParams {
  const params = new URL(url, "http://localhost").searchParams;
  return {
    page: Math.max(1, Number(params.get("page") || 1)),
    limit: Math.min(100, Math.max(1, Number(params.get("limit") || 20))),
    search: params.get("search")?.trim() || "",
    sortBy: params.get("sortBy")?.trim() || "createdAt",
    sortOrder: params.get("sortOrder") === "asc" ? "asc" : "desc",
    status: params.get("status")?.trim() || "",
    includeDeleted: params.get("includeDeleted") === "true",
  };
}

export function buildSoftDeleteFilter(includeDeleted: boolean) {
  return includeDeleted ? {} : { deletedAt: null };
}

export function buildSearchFilter(
  search: string,
  fields: string[],
): Record<string, unknown> {
  if (!search) return {};
  const regex = { $regex: search, $options: "i" };
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
}

export function buildSort(sortBy: string, sortOrder: "asc" | "desc") {
  return { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
}

export function paginateMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function paginated<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> {
  return {
    items,
    pagination: paginateMeta(page, limit, total),
  };
}

export function skip(page: number, limit: number) {
  return (page - 1) * limit;
}

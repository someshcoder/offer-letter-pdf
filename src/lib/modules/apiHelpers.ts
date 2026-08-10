import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { requireModuleAccess } from "@/lib/modules/permissions";
import type { ModuleName } from "@/types/modules/common";
import type { AuthPayload } from "@/lib/auth";

export async function requireModuleAuth(module: ModuleName) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  const access = requireModuleAccess(authResult.user.role, module);
  if (!access.ok) {
    return {
      error: NextResponse.json({ error: access.message }, { status: 403 }),
    } as const;
  }

  return { user: authResult.user } as { user: AuthPayload };
}

export function mapDoc<T extends { _id?: unknown }>(doc: T) {
  return {
    ...doc,
    _id: String(doc._id),
  };
}

export function mapDocs<T extends { _id?: unknown }>(docs: T[]) {
  return docs.map(mapDoc);
}

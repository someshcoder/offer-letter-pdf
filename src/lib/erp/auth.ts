import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { ErpRole } from "@/types/erp";

const ERP_TOKEN_COOKIE = "erp_token";
const ERP_JWT_SECRET = process.env.JWT_SECRET || "erp-dev-secret-very-secure";
const TOKEN_TTL = "24h";

export type ErpAuthPayload = {
  userId: string;
  email: string;
  role: ErpRole;
  franchiseId?: string;
};

export function signErpToken(payload: ErpAuthPayload): string {
  return jwt.sign(payload, ERP_JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyErpToken(token: string): ErpAuthPayload | null {
  try {
    return jwt.verify(token, ERP_JWT_SECRET) as ErpAuthPayload;
  } catch {
    return null;
  }
}

export async function getErpAuth(): Promise<ErpAuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ERP_TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyErpToken(token);
}

export function getErpCookieName() {
  return ERP_TOKEN_COOKIE;
}

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { AccessRole } from "@/types/employee";

const TOKEN_COOKIE = "ems_token";
const DEFAULT_SECRET = "dev-secret-change-me";
const TOKEN_TTL = "12h";
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

export type AuthPayload = {
  userId: string;
  email: string;
  role: AccessRole;
  name?: string;
  sessionId?: string;
};

function getSecret() {
  return JWT_SECRET;
}

export function signAuthToken(payload: AuthPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL });
}

export function verifyAuthToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getSecret()) as AuthPayload;
  } catch {
    return null;
  }
}

export async function getAuthFromCookies(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

export function getAuthCookieName() {
  return TOKEN_COOKIE;
}

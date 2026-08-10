import { NextResponse } from "next/server";
import { getMongoIssue } from "@/lib/mongodb";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  const issue = getMongoIssue(error);
  return jsonError(issue.message, issue.status);
}

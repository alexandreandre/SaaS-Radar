import "server-only";

import { NextResponse } from "next/server";

type ApiErrorLog = {
  type: "api_error";
  route: string;
  status: number;
  message: string;
};

/** Log structuré pour alertes 5xx (portfolio, connecteurs). */
export function logApiError(route: string, status: number, message: string): void {
  const entry: ApiErrorLog = { type: "api_error", route, status, message };
  console.error(JSON.stringify(entry));
}

export function apiErrorResponse(
  route: string,
  status: number,
  message: string,
): NextResponse {
  if (status >= 500) logApiError(route, status, message);
  return NextResponse.json({ error: message }, { status });
}

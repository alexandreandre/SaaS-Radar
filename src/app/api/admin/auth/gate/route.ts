import { NextResponse } from "next/server";
import {
  ADMIN_ACCESS_GENERIC_ERROR,
  getAdminGateRateLimit,
  getClientIp,
} from "@/lib/admin/access-policy";
import { writeAuditLog } from "@/lib/admin/audit";
import { checkRateLimit } from "@/lib/admin/rate-limit";
import {
  adminGateCookieOptions,
  ADMIN_GATE_COOKIE,
  createAdminGateCookieValue,
  getAdminAccessToken,
  isAdminAccessTokenConfigured,
  verifyAdminAccessToken,
} from "@/lib/admin/access-token";

export const dynamic = "force-dynamic";

async function uniformDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 400));
}

export async function POST(request: Request) {
  if (!isAdminAccessTokenConfigured()) {
    return NextResponse.json(
      { error: "Token d'accès admin non configuré." },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  const limit = getAdminGateRateLimit();
  const limited = await checkRateLimit(
    `admin-gate:${ip}`,
    limit.max,
    limit.windowSeconds
  );
  if (!limited.allowed) {
    return NextResponse.json({ error: ADMIN_ACCESS_GENERIC_ERROR }, { status: 429 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: ADMIN_ACCESS_GENERIC_ERROR }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token || !verifyAdminAccessToken(token)) {
    await uniformDelay();
    await writeAuditLog({
      action: "admin.gate.failed",
      metadata: { reason: "invalid_token" },
    });
    return NextResponse.json({ error: ADMIN_ACCESS_GENERIC_ERROR }, { status: 401 });
  }

  await writeAuditLog({ action: "admin.gate.success" });

  const secure = new URL(request.url).protocol === "https:";
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(
    ADMIN_GATE_COOKIE,
    createAdminGateCookieValue(),
    adminGateCookieOptions(secure)
  );
  return response;
}

/** Vérifie que le token est bien configuré (sans exposer sa valeur). */
export async function GET() {
  return NextResponse.json({
    configured: isAdminAccessTokenConfigured(),
    minLength: getAdminAccessToken() ? undefined : 32,
  });
}

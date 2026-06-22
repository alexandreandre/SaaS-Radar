import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ADMIN_LOGIN_GENERIC_ERROR,
  getAdminLoginRateLimit,
  getClientIp,
} from "@/lib/admin/access-policy";
import { writeAuditLog } from "@/lib/admin/audit";
import { checkRateLimit } from "@/lib/admin/rate-limit";
import { hasAdminAccess, normalizeAdminRole } from "@/lib/admin/rbac";
import { requireAdminGateApi } from "@/lib/admin/page-guard";

export const dynamic = "force-dynamic";

async function uniformDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 400));
}

export async function POST(request: Request) {
  if (!requireAdminGateApi(request)) {
    return NextResponse.json({ error: ADMIN_LOGIN_GENERIC_ERROR }, { status: 403 });
  }

  const ip = getClientIp(request);
  const limit = getAdminLoginRateLimit();
  const limited = await checkRateLimit(
    `admin-login:${ip}`,
    limit.max,
    limit.windowSeconds
  );
  if (!limited.allowed) {
    return NextResponse.json({ error: ADMIN_LOGIN_GENERIC_ERROR }, { status: 429 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: ADMIN_LOGIN_GENERIC_ERROR }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json({ error: ADMIN_LOGIN_GENERIC_ERROR }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await uniformDelay();
    await writeAuditLog({
      action: "admin.login.failed",
      metadata: { reason: "invalid_credentials" },
    });
    return NextResponse.json({ error: ADMIN_LOGIN_GENERIC_ERROR }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("admin_role, is_admin, email")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = normalizeAdminRole(profile?.admin_role, profile?.is_admin);
  const signedInEmail = profile?.email ?? data.user.email ?? email;

  if (!hasAdminAccess(role)) {
    await supabase.auth.signOut();
    await uniformDelay();
    await writeAuditLog({
      action: "admin.login.denied",
      actorId: data.user.id,
      actorEmail: signedInEmail,
      metadata: { reason: "not_authorized" },
    });
    return NextResponse.json({ error: ADMIN_LOGIN_GENERIC_ERROR }, { status: 401 });
  }

  await writeAuditLog({
    action: "admin.login.success",
    actorId: data.user.id,
    actorEmail: signedInEmail,
  });

  return NextResponse.json({ status: "ok" });
}

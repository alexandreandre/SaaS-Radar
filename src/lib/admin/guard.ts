import "server-only";
import { timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfile, getCurrentUser } from "@/lib/auth";
import {
  type AdminRole,
  canEditAdmin,
  hasAdminAccess,
  normalizeAdminRole,
  roleMeetsMinimum,
} from "@/lib/admin/rbac";
import { checkRateLimit } from "@/lib/admin/rate-limit";
import { writeAuditLog, type AuditEntry } from "@/lib/admin/audit";

export type AdminContext = {
  userId: string;
  email: string | null;
  role: AdminRole;
  aal2: boolean;
};

export function safeCompareSecret(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function getAdminAalLevel(): Promise<{
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return {
      currentLevel: (data?.currentLevel as "aal1" | "aal2") ?? null,
      nextLevel: (data?.nextLevel as "aal1" | "aal2") ?? null,
    };
  } catch {
    return { currentLevel: null, nextLevel: null };
  }
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getProfile();
  const role = normalizeAdminRole(profile?.admin_role, profile?.is_admin);
  if (!hasAdminAccess(role)) return null;
  const { currentLevel } = await getAdminAalLevel();
  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? null,
    role,
    aal2: currentLevel === "aal2",
  };
}

async function recordAdminSession(ctx: AdminContext): Promise<void> {
  try {
    const h = await headers();
    const admin = createAdminClient();
    await admin.from("admin_sessions").insert({
      user_id: ctx.userId,
      ip_address: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
      user_agent: h.get("user-agent"),
      auth_method: ctx.aal2 ? "mfa" : "session",
    });
  } catch {
    // best-effort
  }
}

export type AdminGuardOptions = {
  minimumRole?: AdminRole;
  requireEdit?: boolean;
  machineSecretEnv?: string;
  rateLimitKey?: string;
  rateLimitMax?: number;
};

export async function requireAdminApi(
  request: Request,
  options: AdminGuardOptions = {}
): Promise<{ ctx: AdminContext } | NextResponse> {
  const {
    minimumRole = "viewer",
    requireEdit = false,
    machineSecretEnv = "ADMIN_SOURCING_SECRET",
    rateLimitKey,
    rateLimitMax = 60,
  } = options;

  const machineSecret = process.env[machineSecretEnv];
  const headerSecret = request.headers.get("x-admin-secret");
  const isMachine = safeCompareSecret(headerSecret, machineSecret);

  if (!isMachine) {
    const ctx = await getAdminContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!roleMeetsMinimum(ctx.role, minimumRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (requireEdit && !canEditAdmin(ctx.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const key = rateLimitKey ?? `admin:${ctx.userId}`;
    const limited = await checkRateLimit(key, rateLimitMax, 60);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    await recordAdminSession(ctx);
    return { ctx };
  }

  const key = rateLimitKey ?? `machine:${request.headers.get("x-forwarded-for") ?? "unknown"}`;
  const limited = await checkRateLimit(key, 10, 60);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return {
    ctx: {
      userId: "machine",
      email: null,
      role: "owner",
      aal2: true,
    },
  };
}

export async function withAdminAudit(
  ctx: AdminContext,
  entry: Omit<AuditEntry, "actorId" | "actorEmail">
): Promise<void> {
  await writeAuditLog({
    ...entry,
    actorId: ctx.userId === "machine" ? null : ctx.userId,
    actorEmail: ctx.email,
  });
}

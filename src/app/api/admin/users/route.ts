import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminRole } from "@/lib/admin/rbac";
import { getAdminUsersList } from "@/lib/admin/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PLANS = new Set(["free", "builder", "pro"]);
const VALID_ADMIN_ROLES = new Set(["none", "viewer", "editor", "owner"]);

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const plan = url.searchParams.get("plan");
  const adminRole = url.searchParams.get("admin_role");
  const subscriptionStatus = url.searchParams.get("subscription_status");
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "50", 10), 1), 100);
  const offset = Math.max(Number.parseInt(url.searchParams.get("offset") ?? "0", 10), 0);

  try {
    const payload = await getAdminUsersList({
      q,
      plan,
      adminRole,
      subscriptionStatus,
      limit,
      offset,
    });
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "owner", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { id, admin_role, plan, is_admin } = body as {
    id: string;
    admin_role?: AdminRole;
    plan?: string;
    is_admin?: boolean;
  };

  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  if (plan && !VALID_PLANS.has(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }
  if (admin_role && !VALID_ADMIN_ROLES.has(admin_role)) {
    return NextResponse.json({ error: "Rôle admin invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: before } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const nextRole = admin_role ?? (before.admin_role as AdminRole);
  if (before.admin_role === "owner" && nextRole !== "owner") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("admin_role", "owner");
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Impossible de rétrograder le dernier propriétaire." },
        { status: 409 }
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (admin_role !== undefined) updates.admin_role = admin_role;
  if (plan) updates.plan = plan;
  if (typeof is_admin === "boolean") updates.is_admin = is_admin;
  if (admin_role && admin_role !== "none") updates.is_admin = true;
  if (admin_role === "none") updates.is_admin = false;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucune modification demandée" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await withAdminAudit(auth.ctx, {
    action: "user.update",
    targetType: "profile",
    targetId: id,
    beforeState: before,
    afterState: data,
  });

  return NextResponse.json({ user: data });
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { computeUserPageStats, type UserPageStats } from "@/lib/admin/metrics";

const VALID_PLANS = new Set(["free", "builder", "pro"]);
const VALID_ADMIN_ROLES = new Set(["none", "viewer", "editor", "owner"]);

export type AdminUsersListParams = {
  q?: string;
  plan?: string | null;
  adminRole?: string | null;
  subscriptionStatus?: string | null;
  limit?: number;
  offset?: number;
};

export type AdminUsersListResult = {
  users: Record<string, unknown>[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
};

export async function getAdminUsersList(
  params: AdminUsersListParams = {}
): Promise<AdminUsersListResult> {
  const q = params.q?.trim() ?? "";
  const plan = params.plan ?? null;
  const adminRole = params.adminRole ?? null;
  const subscriptionStatus = params.subscriptionStatus ?? null;
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);

  const admin = createAdminClient();
  let query = admin.from("profiles").select("*", { count: "exact" }).order("created_at", {
    ascending: false,
  });

  if (q) {
    query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  }
  if (plan && VALID_PLANS.has(plan)) {
    query = query.eq("plan", plan);
  }
  if (adminRole && VALID_ADMIN_ROLES.has(adminRole)) {
    query = query.eq("admin_role", adminRole);
  }
  if (subscriptionStatus === "none") {
    query = query.is("subscription_status", null);
  } else if (subscriptionStatus) {
    query = query.eq("subscription_status", subscriptionStatus);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    users: (data ?? []) as Record<string, unknown>[],
    total,
    hasMore: offset + limit < total,
    limit,
    offset,
  };
}

export async function getAdminUserStats(): Promise<UserPageStats> {
  return computeUserPageStats();
}

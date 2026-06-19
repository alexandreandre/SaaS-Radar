import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function listAdminMarkets() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("world_markets")
    .select("code, name, flag, heat_score, tracked_micro_saas, scope, is_manual_override")
    .order("heat_score", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminMarket = {
  code: string;
  name: string;
  flag?: string;
  heat_score: number;
  tracked_micro_saas: number;
  scope: string;
  is_manual_override: boolean;
};

export async function listAdminMarkets(): Promise<AdminMarket[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("world_markets")
    .select("code, name, flag, heat_score, tracked_micro_saas, scope, is_manual_override")
    .order("heat_score", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminMarket[];
}

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { MrrEntry, ProjectPhase } from "@/lib/portfolio";

export type SyncProjectMetricsInput = {
  projectId: string;
  opportunitySlug: string;
  phase: ProjectPhase;
  currentMrr: number;
  metricsHistory: MetricsSnapshot[];
  mrrHistory: MrrEntry[];
  lastCheckInAt?: string;
  checkInStreak?: number;
};

export async function syncProjectMetrics(userId: string, input: SyncProjectMetricsInput) {
  const supabase = await createServerSupabaseClient();

  const payload = {
    metricsHistory: input.metricsHistory,
    mrrHistory: input.mrrHistory,
    lastCheckInAt: input.lastCheckInAt,
    checkInStreak: input.checkInStreak ?? 0,
  };

  const { error } = await supabase.from("user_projects").upsert(
    {
      id: input.projectId,
      user_id: userId,
      opportunity_slug: input.opportunitySlug,
      name: input.opportunitySlug,
      phase: input.phase,
      mrr_cents: Math.round(input.currentMrr * 100),
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

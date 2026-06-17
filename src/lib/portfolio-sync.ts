import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type {
  BuildSetup,
  BuildSetupSnapshot,
  GitHubConnection,
  HostConnection,
  Milestone,
  MrrEntry,
  ProjectPhase,
} from "@/lib/portfolio";
import type { ConnectorStreams } from "@/lib/connectors/streams";

export type SyncProjectMetricsInput = {
  projectId: string;
  opportunitySlug: string;
  phase: ProjectPhase;
  currentMrr: number;
  metricsHistory: MetricsSnapshot[];
  mrrHistory: MrrEntry[];
  lastCheckInAt?: string;
  checkInStreak?: number;
  milestones?: Milestone[];
  launchChecklistDone?: number[];
  buildSetup?: BuildSetup;
  buildSetupHistory?: BuildSetupSnapshot[];
  githubConnection?: GitHubConnection;
  hostConnection?: HostConnection;
  connectorStreams?: ConnectorStreams;
};

export async function syncProjectMetrics(userId: string, input: SyncProjectMetricsInput) {
  const supabase = await createServerSupabaseClient();

  const payload: Record<string, unknown> = {
    metricsHistory: input.metricsHistory,
    mrrHistory: input.mrrHistory,
    lastCheckInAt: input.lastCheckInAt,
    checkInStreak: input.checkInStreak ?? 0,
  };
  if (input.milestones !== undefined) {
    payload.milestones = input.milestones;
  }
  if (input.launchChecklistDone !== undefined) {
    payload.launchChecklistDone = input.launchChecklistDone;
  }
  if (input.buildSetup !== undefined) {
    payload.buildSetup = input.buildSetup;
  }
  if (input.buildSetupHistory !== undefined) {
    payload.buildSetupHistory = input.buildSetupHistory.slice(0, 10);
  }
  if (input.githubConnection !== undefined) {
    payload.githubConnection = input.githubConnection;
  }
  if (input.hostConnection !== undefined) {
    payload.hostConnection = input.hostConnection;
  }
  if (input.connectorStreams !== undefined) {
    payload.connectorStreams = input.connectorStreams;
  }

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

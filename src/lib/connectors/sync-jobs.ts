import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ConnectorSyncJobStatus = "pending" | "running" | "completed" | "failed";

export type ConnectorSyncJob = {
  id: string;
  userId: string;
  projectId: string;
  provider: string;
  status: ConnectorSyncJobStatus;
  attempts: number;
  lastError: string | null;
};

export async function enqueueConnectorSyncJob(
  userId: string,
  projectId: string,
  provider: string,
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("connector_sync_jobs")
    .insert({
      user_id: userId,
      project_id: projectId,
      provider,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function listPendingConnectorSyncJobs(limit = 50): Promise<ConnectorSyncJob[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("connector_sync_jobs")
    .select("id, user_id, project_id, provider, status, attempts, last_error")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    projectId: row.project_id as string,
    provider: row.provider as string,
    status: row.status as ConnectorSyncJobStatus,
    attempts: row.attempts as number,
    lastError: (row.last_error as string | null) ?? null,
  }));
}

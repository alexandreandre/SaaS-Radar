import "server-only";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RunOptions } from "@/lib/sourcing/run";

export type JobPayload = Omit<RunOptions, "runId"> & {
  triggeredBy?: string;
};

export type QueuedJob = {
  id: string;
  batch_id: string;
  run_id: string;
  country_code: string;
  status: string;
  attempts: number;
  max_attempts: number;
  payload: JobPayload;
  error: string | null;
  scheduled_at: string;
};

export async function enqueueSourcingBatch(
  jobs: Array<{ runId: string; countryCode: string; payload: JobPayload }>
): Promise<{ batchId: string; jobIds: string[] }> {
  const admin = createAdminClient();
  const batchId = randomUUID();

  const rows = jobs.map((j) => ({
    batch_id: batchId,
    run_id: j.runId,
    country_code: j.countryCode,
    status: "pending" as const,
    payload: j.payload as Record<string, unknown>,
  }));

  const { data, error } = await admin
    .from("sourcing_job_queue")
    .insert(rows)
    .select("id");

  if (error) throw new Error(error.message);
  return { batchId, jobIds: (data ?? []).map((r) => r.id as string) };
}

/** Claim le prochain job via RPC Postgres (SKIP LOCKED). */
export async function claimNextJob(): Promise<QueuedJob | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_sourcing_job");
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return row as QueuedJob;
}

export async function completeJob(
  jobId: string,
  status: "done" | "failed",
  error?: string
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("sourcing_job_queue")
    .update({
      status,
      error: error ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

export async function rescheduleJob(job: QueuedJob, delayMs: number): Promise<void> {
  const admin = createAdminClient();
  const scheduledAt = new Date(Date.now() + delayMs).toISOString();
  const failed = job.attempts >= job.max_attempts;
  await admin
    .from("sourcing_job_queue")
    .update({
      status: failed ? "failed" : "pending",
      error: failed ? job.error : null,
      scheduled_at: failed ? job.scheduled_at : scheduledAt,
      finished_at: failed ? new Date().toISOString() : null,
    })
    .eq("id", job.id);
}

export async function getBatchJobs(batchId: string): Promise<QueuedJob[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sourcing_job_queue")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as QueuedJob[];
}

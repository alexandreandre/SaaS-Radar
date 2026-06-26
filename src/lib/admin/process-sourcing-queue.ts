import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { assertValidCountryCode, normalizeCountryCode } from "@/lib/sourcing/countries";
import { runSourcing } from "@/lib/sourcing/run";
import {
  claimNextJob,
  completeJob,
  rescheduleJob,
  type QueuedJob,
} from "@/lib/admin/sourcing-job-queue";
import {
  SourcingCancelledError,
  getWrittenSlugsFromConfig,
} from "@/lib/admin/sourcing-cancel";
import { revalidateOpportunitiesCache } from "@/lib/admin/weekly-pick";

function createAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis");
  }
  return createClient(url, key);
}

async function executeJob(job: QueuedJob): Promise<void> {
  const admin = createAdminClient();
  const country = await assertValidCountryCode(job.country_code);
  const payload = job.payload ?? {};

  const { data: existingRun } = await admin
    .from("sourcing_runs")
    .select("config")
    .eq("id", job.run_id)
    .maybeSingle();
  const existingConfig = (existingRun?.config ?? {}) as Record<string, unknown>;
  const mergedConfig: Record<string, unknown> = {
    ...existingConfig,
    ...(payload.config ?? {}),
    originCountryCode: country.code,
    batchJobId: job.id,
  };
  if (job.attempts <= 1) {
    mergedConfig.written_slugs = [];
  }

  await admin
    .from("sourcing_runs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      count_discovered: 0,
      count_structured: 0,
      count_written: getWrittenSlugsFromConfig(mergedConfig).length,
      config: mergedConfig,
    })
    .eq("id", job.run_id);

  await runSourcing({
    ...payload,
    originCountryCode: country.code,
    runId: job.run_id,
    mode: payload.mode ?? "direct",
    revalidate: payload.revalidate ?? true,
    manageWeeklyPick: payload.manageWeeklyPick ?? false,
    markRunError: false,
    pipelineProfile:
      payload.pipelineProfile ??
      (payload.config?.pipelineProfile === "catalogue" ? "catalogue" : undefined),
    persistRun: true,
    config: mergedConfig,
  });
}

async function failJob(job: QueuedJob, msg: string): Promise<void> {
  const admin = createAdminClient();

  if (job.attempts < job.max_attempts) {
    await rescheduleJob(job, 30_000 * job.attempts);
    await admin
      .from("sourcing_runs")
      .update({
        status: "queued",
        error: null,
        finished_at: null,
      })
      .eq("id", job.run_id);
    return;
  }

  await completeJob(job.id, "failed", msg);
  await admin
    .from("sourcing_runs")
    .update({
      status: "error",
      error: msg,
      finished_at: new Date().toISOString(),
    })
    .eq("id", job.run_id);
}

/** Remet les jobs bloqués en processing (crash worker) en pending. */
export async function recoverStuckQueueJobs(maxAgeMinutes = 15): Promise<number> {
  const admin = createAdminClient();
  let recovered = 0;

  // Run encore "queued" mais job "processing" = claim abandonné
  const { data: queuedRuns } = await admin.from("sourcing_runs").select("id").eq("status", "queued");
  for (const run of queuedRuns ?? []) {
    const { data: jobs } = await admin
      .from("sourcing_job_queue")
      .select("id")
      .eq("run_id", run.id)
      .eq("status", "processing");
    for (const job of jobs ?? []) {
      await admin
        .from("sourcing_job_queue")
        .update({ status: "pending", started_at: null })
        .eq("id", job.id);
      recovered++;
    }
  }

  const cutoff = new Date(Date.now() - maxAgeMinutes * 60_000).toISOString();
  const { data } = await admin
    .from("sourcing_job_queue")
    .select("id, run_id")
    .eq("status", "processing")
    .lt("started_at", cutoff);

  for (const row of data ?? []) {
    await admin
      .from("sourcing_job_queue")
      .update({ status: "pending", started_at: null })
      .eq("id", row.id);
    recovered++;
  }

  const { data: pendingJobs } = await admin
    .from("sourcing_job_queue")
    .select("run_id")
    .eq("status", "pending");

  for (const job of pendingJobs ?? []) {
    const { data: run } = await admin
      .from("sourcing_runs")
      .select("status")
      .eq("id", job.run_id)
      .maybeSingle();
    if (run?.status === "error") {
      await admin
        .from("sourcing_runs")
        .update({ status: "queued", error: null, finished_at: null })
        .eq("id", job.run_id);
      recovered++;
    }
  }

  return recovered;
}

async function loadRunnableJobs(options?: {
  runIds?: string[];
  maxJobs?: number;
}): Promise<QueuedJob[]> {
  const admin = createAdminClient();
  const maxJobs = options?.maxJobs ?? 50;

  if (options?.runIds?.length) {
    const { data, error } = await admin
      .from("sourcing_job_queue")
      .select("*")
      .in("run_id", options.runIds)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: true })
      .limit(maxJobs);
    if (error) throw new Error(error.message);
    return (data ?? []) as QueuedJob[];
  }

  const jobs: QueuedJob[] = [];
  while (jobs.length < maxJobs) {
    const job = await claimNextJob();
    if (!job) break;
    jobs.push(job);
  }
  return jobs;
}

async function runJob(job: QueuedJob): Promise<void> {
  const admin = createAdminClient();

  if (job.status === "pending") {
    const { data, error } = await admin
      .from("sourcing_job_queue")
      .update({
        status: "processing",
        attempts: job.attempts + 1,
        started_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) job = data as QueuedJob;
  }

  console.log(
    `▶ Job ${job.id} — ${normalizeCountryCode(job.country_code)} (attempt ${job.attempts})`
  );

  try {
    await executeJob(job);
    await completeJob(job.id, "done");
    const jobMode = job.payload?.mode ?? "direct";
    if (jobMode === "direct" || jobMode === "auto") {
      revalidateOpportunitiesCache();
    }
    console.log(`✓ Job ${job.id} terminé`);
  } catch (err) {
    if (err instanceof SourcingCancelledError) {
      await completeJob(job.id, "cancelled", err.message);
      console.log(`⏹ Job ${job.id} annulé`);
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Job ${job.id} : ${msg}`);
    await failJob(job, msg);
    throw err;
  }
}

/** Exécute les jobs d'un batch fraîchement créé (par run_id, sans claim FIFO). */
export async function executePendingJobs(options?: {
  runIds?: string[];
  maxJobs?: number;
}): Promise<{ processed: number; failed: number }> {
  await recoverStuckQueueJobs();

  const jobs = await loadRunnableJobs(options);
  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    if (job.status === "processing") {
      const admin = createAdminClient();
      await admin.from("sourcing_job_queue").update({ status: "pending" }).eq("id", job.id);
    }

    try {
      await runJob(job);
      processed++;
    } catch {
      failed++;
    }
  }

  return { processed, failed };
}

export async function processOneSourcingJob(): Promise<boolean> {
  const jobs = await loadRunnableJobs({ maxJobs: 1 });
  if (jobs.length === 0) return false;

  try {
    await runJob(jobs[0]!);
    return true;
  } catch {
    return true;
  }
}

export async function processSourcingQueue(options?: {
  maxJobs?: number;
  runIds?: string[];
}): Promise<{ processed: number; failed: number }> {
  return executePendingJobs(options);
}

function getAppOrigin(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return undefined;
}

/** Lance l'exécution sans bloquer la requête HTTP / l'action client. */
export function kickSourcingExecution(options?: {
  runIds?: string[];
  maxJobs?: number;
  origin?: string;
}): void {
  const payload = {
    runIds: options?.runIds,
    maxJobs: options?.maxJobs ?? (options?.runIds?.length ? options.runIds.length : 10),
  };

  const secret = process.env.ADMIN_SOURCING_SECRET;
  const origin = options?.origin ?? getAppOrigin();

  if (secret && origin) {
    void fetch(`${origin}/api/admin/sourcing/process-queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret,
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error("[sourcing] kick via process-queue:", err);
    });
    return;
  }

  void executePendingJobs(payload).catch((err) => {
    console.error("[sourcing] exécution arrière-plan:", err);
  });
}

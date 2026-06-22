import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSourcingRun } from "@/lib/admin/sourcing-jobs";
import { triggerRevalidation } from "@/lib/sourcing/revalidate";
import { isRunActive } from "@/lib/admin/sourcing-run-status";

export class SourcingCancelledError extends Error {
  constructor(message = "Sourcing annulé") {
    super(message);
    this.name = "SourcingCancelledError";
  }
}

export function getWrittenSlugsFromConfig(config: unknown): string[] {
  if (!config || typeof config !== "object") return [];
  const slugs = (config as Record<string, unknown>).written_slugs;
  return Array.isArray(slugs) ? slugs.filter((s): s is string => typeof s === "string") : [];
}

export async function isRunCancelRequested(runId: string | null): Promise<boolean> {
  if (!runId) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("sourcing_runs")
    .select("config")
    .eq("id", runId)
    .maybeSingle();
  const config = data?.config as Record<string, unknown> | null;
  return config?.cancel_requested === true;
}

export async function shouldDiscardOnCancel(runId: string | null): Promise<boolean> {
  if (!runId) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("sourcing_runs")
    .select("config")
    .eq("id", runId)
    .maybeSingle();
  const config = data?.config as Record<string, unknown> | null;
  return config?.discard_opportunities === true;
}

export async function discardRunOpportunities(runIds: string[]): Promise<number> {
  const admin = createAdminClient();
  const allSlugs = new Set<string>();

  for (const runId of runIds) {
    const run = await getSourcingRun(runId);
    if (!run) continue;
    for (const slug of getWrittenSlugsFromConfig(run.config)) {
      allSlugs.add(slug);
    }
  }

  if (allSlugs.size === 0) return 0;

  const slugs = Array.from(allSlugs);
  const { error } = await admin.from("opportunities").delete().in("slug", slugs);
  if (error) throw new Error(error.message);

  for (const runId of runIds) {
    const run = await getSourcingRun(runId);
    if (!run) continue;
    const config = (run.config ?? {}) as Record<string, unknown>;
    await admin
      .from("sourcing_runs")
      .update({
        count_written: 0,
        config: { ...config, written_slugs: [], discarded: true },
      })
      .eq("id", runId);
  }

  await triggerRevalidation();
  return slugs.length;
}

export async function stopSourcingRuns(options: {
  runIds: string[];
  keepWritten: boolean;
  cancelledBy?: string;
}): Promise<{ stopped: number; writtenSlugs: string[] }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  let stopped = 0;
  const writtenSlugs = new Set<string>();

  for (const runId of options.runIds) {
    const run = await getSourcingRun(runId);
    if (!run || !isRunActive(run.status as string)) continue;

    for (const slug of getWrittenSlugsFromConfig(run.config)) {
      writtenSlugs.add(slug);
    }

    const config = {
      ...((run.config ?? {}) as Record<string, unknown>),
      cancel_requested: true,
      cancelled: true,
      cancelled_at: now,
      cancelled_by: options.cancelledBy ?? null,
      discard_opportunities: !options.keepWritten,
    };

    await admin
      .from("sourcing_runs")
      .update({ config })
      .eq("id", runId);

    await admin
      .from("sourcing_job_queue")
      .update({ status: "cancelled", finished_at: now, error: "Annulé par l'utilisateur" })
      .eq("run_id", runId)
      .in("status", ["pending", "processing"]);

    if (run.status === "queued") {
      const written = getWrittenSlugsFromConfig(run.config).length;
      await admin
        .from("sourcing_runs")
        .update({
          status: written > 0 ? "partial" : "empty",
          finished_at: now,
          error: "Annulé par l'utilisateur",
          config,
        })
        .eq("id", runId);
    }

    stopped++;
  }

  if (!options.keepWritten && writtenSlugs.size > 0) {
    await discardRunOpportunities(options.runIds);
    writtenSlugs.clear();
  }

  return { stopped, writtenSlugs: Array.from(writtenSlugs) };
}

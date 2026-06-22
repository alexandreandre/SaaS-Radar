"use server";

import { canEditAdmin } from "@/lib/admin/rbac";
import { getAdminContext } from "@/lib/admin/guard";
import { writeAuditLog } from "@/lib/admin/audit";
import { kickSourcingExecution } from "@/lib/admin/process-sourcing-queue";
import {
  assertValidCountryCodes,
  MAX_COUNTRIES_PER_BATCH,
} from "@/lib/sourcing/countries";
import { SECTORS } from "@/lib/sourcing/constants";
import { startSourcingBatch, getSourcingRun } from "@/lib/admin/sourcing-jobs";
import { stopSourcingRuns } from "@/lib/admin/sourcing-cancel";

export async function processSourcingQueueAction(options?: {
  maxJobs?: number;
  runIds?: string[];
}): Promise<{ started: boolean; runIds?: string[] }> {
  const ctx = await getAdminContext();
  if (!ctx || !canEditAdmin(ctx.role)) {
    throw new Error("Accès refusé");
  }

  kickSourcingExecution(options);

  await writeAuditLog({
    action: "sourcing.process_queue",
    targetType: "sourcing_run",
    metadata: { runIds: options?.runIds ?? null, maxJobs: options?.maxJobs ?? 10 },
    actorId: ctx.userId,
    actorEmail: ctx.email,
  });

  return { started: true, runIds: options?.runIds };
}

export async function launchSourcingAction(input: {
  count: number;
  countries: string[];
  sector?: string;
  premium?: boolean;
  minScore?: number;
}): Promise<{ runIds: string[]; batchId: string }> {
  const ctx = await getAdminContext();
  if (!ctx || !canEditAdmin(ctx.role)) {
    throw new Error("Accès refusé");
  }

  if (input.count < 1 || input.count > 10) {
    throw new Error("count doit être entre 1 et 10");
  }
  if (input.countries.length === 0) {
    throw new Error("Sélectionnez au moins un pays");
  }
  if (input.countries.length > MAX_COUNTRIES_PER_BATCH) {
    throw new Error(`Maximum ${MAX_COUNTRIES_PER_BATCH} pays par lancement`);
  }

  let sector: string | undefined;
  if (input.sector) {
    if (!(SECTORS as readonly string[]).includes(input.sector)) {
      throw new Error("sector invalide");
    }
    sector = input.sector;
  }

  const countries = await assertValidCountryCodes(input.countries);
  const premium = input.premium ?? false;
  const minScore = input.minScore ?? 0;
  const config = {
    count: input.count,
    countries: countries.map((c) => c.code),
    sector,
    premium,
    minScore,
    mode: "direct" as const,
    pipelineProfile: "standard" as const,
  };

  const { runIds, batchId } = await startSourcingBatch({
    countries: countries.map((c) => c.code),
    count: input.count,
    sector,
    premium,
    minScore,
    mode: "direct",
    triggeredBy: ctx.userId,
    config,
    revalidate: true,
    manageWeeklyPick: false,
  });

  kickSourcingExecution({ runIds });

  await writeAuditLog({
    action: "sourcing.start",
    targetType: "sourcing_run",
    targetId: runIds[0] ?? null,
    metadata: config,
    actorId: ctx.userId,
    actorEmail: ctx.email,
  });

  return { runIds, batchId };
}

export async function resumeQueuedRunsAction(runIds: string[]): Promise<{ started: boolean }> {
  const ctx = await getAdminContext();
  if (!ctx || !canEditAdmin(ctx.role)) {
    return { started: false };
  }
  if (runIds.length === 0) return { started: false };

  kickSourcingExecution({ runIds, maxJobs: runIds.length });
  return { started: true };
}

export async function relaunchSourcingRunAction(
  runId: string
): Promise<{ runIds: string[]; batchId: string }> {
  const ctx = await getAdminContext();
  if (!ctx || !canEditAdmin(ctx.role)) {
    throw new Error("Accès refusé");
  }

  const run = await getSourcingRun(runId);
  if (!run) throw new Error("Run introuvable");

  const country = run.origin_country_code as string | null;
  if (!country) {
    throw new Error("Ce run n'a pas de pays d'origine — relance impossible");
  }

  const { runIds, batchId } = await launchSourcingAction({
    count: Number(run.count_requested) || 3,
    countries: [country],
    sector: (run.sector as string | null) ?? undefined,
    premium: true,
  });

  return { runIds, batchId };
}

export async function stopSourcingAction(input: {
  runIds: string[];
  keepWritten: boolean;
}): Promise<{ stopped: number; deletedOpportunities: number }> {
  const ctx = await getAdminContext();
  if (!ctx || !canEditAdmin(ctx.role)) {
    throw new Error("Accès refusé");
  }

  if (input.runIds.length === 0) {
    throw new Error("Aucun run actif à arrêter");
  }

  const { stopped, writtenSlugs } = await stopSourcingRuns({
    runIds: input.runIds,
    keepWritten: input.keepWritten,
    cancelledBy: ctx.userId,
  });

  let deletedOpportunities = 0;
  if (!input.keepWritten && writtenSlugs.length > 0) {
    deletedOpportunities = writtenSlugs.length;
  }

  await writeAuditLog({
    action: "sourcing.stop",
    targetType: "sourcing_run",
    metadata: {
      runIds: input.runIds,
      keepWritten: input.keepWritten,
      stopped,
      deletedOpportunities,
    },
    actorId: ctx.userId,
    actorEmail: ctx.email,
  });

  return { stopped, deletedOpportunities };
}

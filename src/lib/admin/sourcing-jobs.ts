import "server-only";
import { randomUUID } from "crypto";
import type { RunOptions } from "@/lib/sourcing/run";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertValidCountryCodes,
  MAX_COUNTRIES_PER_BATCH,
  normalizeCountryCode,
  type SourcingCountry,
} from "@/lib/sourcing/countries";
import { enqueueSourcingBatch } from "@/lib/admin/sourcing-job-queue";
import { withPromptVersion } from "@/lib/sourcing/prompt-version";

export type SourcingBatchOptions = Omit<RunOptions, "runId" | "originCountryCode"> & {
  countries: string[];
  triggeredBy?: string;
};

export async function isCountryRunning(countryCode: string): Promise<boolean> {
  const code = normalizeCountryCode(countryCode);
  const admin = createAdminClient();

  const { data: queued } = await admin
    .from("sourcing_job_queue")
    .select("id")
    .in("status", ["pending", "processing"])
    .eq("country_code", code)
    .limit(1);
  if ((queued?.length ?? 0) > 0) return true;

  const { data } = await admin
    .from("sourcing_runs")
    .select("id")
    .eq("status", "running")
    .eq("origin_country_code", code)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function insertQueuedRun(
  country: SourcingCountry,
  batchId: string,
  opts: Omit<RunOptions, "runId" | "originCountryCode"> & {
    triggeredBy?: string;
    batchCountries?: string[];
  }
): Promise<string> {
  const admin = createAdminClient();
  const config = withPromptVersion({
    ...(opts.config ?? {}),
    originCountryCode: country.code,
    countries: opts.batchCountries ?? [country.code],
    batchId,
  });

  const { data, error } = await admin
    .from("sourcing_runs")
    .insert({
      started_at: new Date().toISOString(),
      status: "queued",
      count_requested: opts.count,
      sector: opts.sector ?? null,
      premium: opts.premium ?? false,
      origin_country_code: country.code,
      triggered_by: opts.triggeredBy ?? null,
      config,
    })
    .select("id")
    .single();

  if (error || !data?.id) throw new Error(error?.message ?? "Impossible de créer le run");
  return data.id as string;
}

export async function startSourcingJob(
  opts: RunOptions & { triggeredBy?: string; originCountryCode: string }
): Promise<{ runId: string; batchId: string }> {
  const countries = await assertValidCountryCodes([opts.originCountryCode]);
  const country = countries[0];

  if (await isCountryRunning(country.code)) {
    throw new Error(`Un run est déjà en cours pour ${country.code}`);
  }

  const batchId = randomUUID();
  const runId = await insertQueuedRun(country, batchId, {
    ...opts,
    batchCountries: [country.code],
  });

  await enqueueSourcingBatch([
    {
      runId,
      countryCode: country.code,
      payload: {
        count: opts.count,
        sector: opts.sector,
        premium: opts.premium,
        minScore: opts.minScore,
        mode: opts.mode,
        maxCostUsd: opts.maxCostUsd,
        triggeredBy: opts.triggeredBy,
        config: opts.config,
      },
    },
  ]);

  return { runId, batchId };
}

export async function startSourcingBatch(
  opts: SourcingBatchOptions
): Promise<{ runIds: string[]; batchId: string; countries: SourcingCountry[] }> {
  if (opts.countries.length > MAX_COUNTRIES_PER_BATCH) {
    throw new Error(`Maximum ${MAX_COUNTRIES_PER_BATCH} pays par batch`);
  }

  const countries = await assertValidCountryCodes(opts.countries);
  const batchCodes = countries.map((c) => c.code);
  const batchId = randomUUID();

  for (const country of countries) {
    if (await isCountryRunning(country.code)) {
      throw new Error(`Un run est déjà en cours pour ${country.code}`);
    }
  }

  const runIds: string[] = [];
  const queueJobs: Array<{
    runId: string;
    countryCode: string;
    payload: Omit<RunOptions, "runId"> & { triggeredBy?: string };
  }> = [];

  for (const country of countries) {
    const runId = await insertQueuedRun(country, batchId, {
      ...opts,
      batchCountries: batchCodes,
    });
    runIds.push(runId);
    queueJobs.push({
      runId,
      countryCode: country.code,
      payload: {
        count: opts.count,
        sector: opts.sector,
        premium: opts.premium,
        minScore: opts.minScore,
        mode: opts.mode,
        maxCostUsd: opts.maxCostUsd,
        revalidate: opts.revalidate,
        triggeredBy: opts.triggeredBy,
        config: opts.config,
      },
    });
  }

  await enqueueSourcingBatch(queueJobs);

  return { runIds, batchId, countries };
}

export async function getSourcingRun(runId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sourcing_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listActiveSourcingRuns() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sourcing_runs")
    .select("*")
    .in("status", ["queued", "running"])
    .order("started_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listSourcingRuns(limit = 20) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sourcing_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function recoverStaleRuns(maxAgeMinutes = 30): Promise<number> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60_000).toISOString();
  let recovered = 0;

  const { data: running } = await admin
    .from("sourcing_runs")
    .select("id")
    .eq("status", "running")
    .lt("started_at", cutoff);

  for (const row of running ?? []) {
    await admin
      .from("sourcing_runs")
      .update({
        status: "error",
        error: "Run orphelin récupéré automatiquement",
        finished_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    recovered++;
  }

  const { data: queued } = await admin
    .from("sourcing_runs")
    .select("id")
    .eq("status", "queued")
    .lt("started_at", cutoff);

  for (const row of queued ?? []) {
    const { data: jobs } = await admin
      .from("sourcing_job_queue")
      .select("id, status")
      .eq("run_id", row.id)
      .limit(1);

    const job = jobs?.[0];
    if (!job || job.status === "failed") {
      await admin
        .from("sourcing_runs")
        .update({
          status: "error",
          error: job
            ? "Job en file échoué — relancez le sourcing"
            : "Run en file sans job associé",
          finished_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      recovered++;
    }
  }

  return recovered;
}

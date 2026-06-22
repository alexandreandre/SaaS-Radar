import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { toOpportunityRow } from "@/lib/supabase/mappers";
import type { Opportunity } from "@/types/opportunity";
import {
  MAX_DISCOVERY_ROUNDS,
  MODELS,
  resolveSourcingScale,
} from "./constants";
import { CostTracker, assertModelsActive } from "./openrouter";
import { discoverLeads } from "./discover";
import { structureLead } from "./structure";
import {
  assembleOpportunity,
  checkMrrSanity,
  getMinScore,
  meetsScoreGate,
  normalizeLead,
  slugify,
} from "./assemble";
import { previewOpportunityScore } from "@/lib/scoring/compute";
import { detectCountryMismatch } from "./traction-quality";
import {
  analyticalSchema,
  formatZodError,
  hasGeminiFixableError,
  opportunityRawSchema,
  type FactualLead,
} from "./schema";
import { triggerRevalidation } from "./revalidate";
import {
  consoleLogger,
  type LogFn,
  type RunReport,
  type RunSkip,
  type SourcingEvent,
} from "./logger";
import { findDedupMatches, loadExistingForDedup, registerOpportunityInDedupIndex, isBlockedByDedupIndex } from "@/lib/admin/sourcing-dedup";
import { normalizeUrlKey, rootDomainFromUrl, type DedupIndex } from "@/lib/admin/sourcing-dedup.shared";
import { processDraftsAutoPublish } from "@/lib/admin/process-draft-auto-publish";
import { loadPublishSettings } from "@/lib/admin/publish-policy";
import {
  verifyLeadSources,
  passesUrlGate,
  pruneTractionSignals,
  passesTractionGate,
  type SourceVerification,
} from "./verify-sources";
import { verifyLeadFacts, passesFactCheckGate, inferFactVerificationFromSources, type FactVerification } from "./verify-facts";
import { verifyPremiumFields } from "./premium-verify";
import { assertWithinMonthlyCostCap } from "./cost-guard";
import { notifyPendingDraftsIfEnabled } from "./notify-pending";
import { recordRunMetrics } from "./metrics";
import { withPromptVersion } from "./prompt-version";
import { mapWithConcurrency } from "./concurrency";
import { getCachedLeads, setCachedLeads } from "./discover-cache";
import { loadDynamicExclusions } from "./dynamic-exclusions";
import {
  assertValidCountryCode,
  DEFAULT_SOURCING_COUNTRY,
  normalizeCountryCode,
  type SourcingCountry,
} from "./countries";
import { isCatalogueProfile, type PipelineProfile } from "./pipeline-profile.shared";
import { enrichTractionSignals } from "./enrich-traction";
import {
  assessTractionQuality,
  countCoveredCategories,
  needsTractionEnrichment,
} from "./traction-quality";
import {
  discardRunOpportunities,
  getWrittenSlugsFromConfig,
  isRunCancelRequested,
  shouldDiscardOnCancel,
  SourcingCancelledError,
} from "@/lib/admin/sourcing-cancel";

export type { PipelineProfile } from "./pipeline-profile.shared";
export { isCatalogueProfile } from "./pipeline-profile.shared";

export interface RunOptions {
  count: number;
  /** Code ISO2 du marché d'origine ciblé (ex. US, GB). */
  originCountryCode?: string;
  sector?: string;
  premium?: boolean;
  /** Seuil de score plancher. Si non fourni, lit SOURCING_MIN_SCORE. */
  minScore?: number;
  /** standard = filtres qualité ; catalogue = publication directe minimale (dedup + Zod). */
  pipelineProfile?: PipelineProfile;
  /** Logger d'événements. Défaut : console (CLI). */
  onLog?: LogFn;
  /** Déclenche la revalidation prod après upsert. Défaut : true. */
  revalidate?: boolean;
  /** Persiste le run dans la table sourcing_runs. Défaut : true (best-effort). */
  persistRun?: boolean;
  /** Promeut la meilleure fiche du batch en weekly_pick. Défaut : true. */
  manageWeeklyPick?: boolean;
  /** direct = upsert opportunities ; draft = file d'approbation. Défaut : draft. */
  mode?: "direct" | "draft";
  /** ID run existant (jobs async). */
  runId?: string | null;
  /** Utilisateur ayant déclenché le run. */
  triggeredBy?: string;
  /** Config persistée sur sourcing_runs.config */
  config?: Record<string, unknown>;
  /** Plafond coût USD pour ce run (stop mid-batch si dépassé). */
  maxCostUsd?: number;
  /** Si false, le statut error est laissé au worker async (retries job queue). */
  markRunError?: boolean;
}

function createAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Renseignez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}

type Supabase = ReturnType<typeof createAdminClient>;

/** Crée la ligne sourcing_runs en début de run. Best-effort : ne bloque jamais le run. */
async function insertRunRecord(
  supabase: Supabase,
  opts: {
    requested: number;
    sector?: string;
    premium: boolean;
    originCountryCode: string;
    startedAt: string;
    triggeredBy?: string;
    config?: Record<string, unknown>;
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("sourcing_runs")
      .insert({
        started_at: opts.startedAt,
        status: "running",
        count_requested: opts.requested,
        sector: opts.sector ?? null,
        premium: opts.premium,
        origin_country_code: opts.originCountryCode,
        triggered_by: opts.triggeredBy ?? null,
        config: opts.config ?? {},
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return (data?.id as string) ?? null;
  } catch (err) {
    console.warn(
      `[sourcing_runs] insertion ignorée (table absente ?) : ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

/** Met à jour la ligne sourcing_runs en fin de run. Best-effort. */
async function finishRunRecord(
  supabase: Supabase,
  id: string | null,
  report: RunReport,
  extras?: {
    costUsd?: number;
    tokensInput?: number;
    tokensOutput?: number;
    events?: unknown[];
    error?: string | null;
  }
): Promise<void> {
  if (!id) return;
  try {
    const { error } = await supabase
      .from("sourcing_runs")
      .update({
        finished_at: report.finishedAt,
        status: report.status,
        count_discovered: report.discovered,
        count_structured: report.structured,
        count_written: report.written,
        cost_line: report.costLine,
        skipped: report.skipped,
        cost_usd: extras?.costUsd ?? null,
        tokens_input: extras?.tokensInput ?? 0,
        tokens_output: extras?.tokensOutput ?? 0,
        events: extras?.events ?? [],
        ...(extras?.error !== undefined ? { error: extras.error } : {}),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    console.warn(
      `[sourcing_runs] mise à jour ignorée : ${err instanceof Error ? err.message : err}`
    );
  }
}

/**
 * Promeut une fiche en weekly_pick (et retire le flag des autres). Best-effort.
 * Appelé une fois par run → avec le cron hebdomadaire, équivaut à une rotation hebdo.
 */
async function promoteWeeklyPick(
  supabase: Supabase,
  slug: string,
  log: LogFn
): Promise<void> {
  try {
    const { error: clearError } = await supabase
      .from("opportunities")
      .update({ weekly_pick: false })
      .eq("weekly_pick", true);
    if (clearError) throw new Error(clearError.message);

    const { error: setError } = await supabase
      .from("opportunities")
      .update({ weekly_pick: true })
      .eq("slug", slug);
    if (setError) throw new Error(setError.message);

    log({ type: "warn", message: `weekly_pick promu : ${slug}` });
  } catch (err) {
    log({
      type: "warn",
      message: `weekly_pick non mis à jour : ${err instanceof Error ? err.message : err}`,
    });
  }
}

/** Marque la ligne sourcing_runs en erreur. Best-effort. */
async function failRunRecord(
  supabase: Supabase,
  id: string | null,
  message: string,
  extras?: {
    events?: unknown[];
    costUsd?: number;
    tokensInput?: number;
    tokensOutput?: number;
  }
): Promise<void> {
  if (!id) return;
  try {
    await supabase
      .from("sourcing_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "error",
        error: message,
        events: extras?.events ?? [],
        cost_usd: extras?.costUsd ?? null,
        tokens_input: extras?.tokensInput ?? 0,
        tokens_output: extras?.tokensOutput ?? 0,
      })
      .eq("id", id);
  } catch {
    // silencieux
  }
}

async function loadMarketAvgMrr(
  supabase: Supabase,
  countryCode: string
): Promise<number | null> {
  try {
    const { data } = await supabase
      .from("world_markets")
      .select("avg_top_mrr_usd")
      .eq("code", countryCode.toUpperCase())
      .maybeSingle();
    return data?.avg_top_mrr_usd != null ? Number(data.avg_top_mrr_usd) : null;
  } catch {
    return null;
  }
}

async function patchRunProgress(
  supabase: Supabase,
  runId: string | null,
  patch: Partial<{
    count_discovered: number;
    count_structured: number;
    count_written: number;
    events: SourcingEvent[];
  }>
): Promise<void> {
  if (!runId || Object.keys(patch).length === 0) return;
  try {
    const { error } = await supabase.from("sourcing_runs").update(patch).eq("id", runId);
    if (error) throw new Error(error.message);
  } catch (err) {
    console.warn(
      `[sourcing_runs] patch progress ignoré : ${err instanceof Error ? err.message : err}`
    );
  }
}

async function appendRunWrittenSlug(
  supabase: Supabase,
  runId: string,
  slug: string,
  structuredCount?: number,
  maxCount?: number
): Promise<number> {
  const { data } = await supabase
    .from("sourcing_runs")
    .select("config, count_structured")
    .eq("id", runId)
    .maybeSingle();
  if (!data) return 0;

  const config = (data.config ?? {}) as Record<string, unknown>;
  const slugs = getWrittenSlugsFromConfig(config);
  if (slugs.includes(slug)) return slugs.length;
  if (maxCount != null && slugs.length >= maxCount) return slugs.length;

  const nextSlugs = [...slugs, slug];
  const nextStructured = Math.max(
    Number(data.count_structured) || 0,
    structuredCount ?? 0,
    nextSlugs.length
  );
  await supabase
    .from("sourcing_runs")
    .update({
      count_written: nextSlugs.length,
      count_structured: nextStructured,
      config: { ...config, written_slugs: nextSlugs },
    })
    .eq("id", runId);
  return nextSlugs.length;
}

async function getRunWrittenCount(supabase: Supabase, runId: string): Promise<number> {
  const { data } = await supabase
    .from("sourcing_runs")
    .select("config, count_written")
    .eq("id", runId)
    .maybeSingle();
  if (!data) return 0;
  const fromConfig = getWrittenSlugsFromConfig(data.config).length;
  const fromColumn = Number(data.count_written) || 0;
  return Math.max(fromConfig, fromColumn);
}

async function persistDirectOpportunity(
  supabase: Supabase,
  opportunity: Opportunity,
  runId: string | null,
  structuredCount?: number,
  maxCount?: number,
  dedupIndex?: DedupIndex
): Promise<boolean> {
  if (runId && maxCount != null) {
    const current = await getRunWrittenCount(supabase, runId);
    if (current >= maxCount) return false;
  }

  const { data: existing } = await supabase
    .from("opportunities")
    .select("status")
    .eq("slug", opportunity.slug)
    .maybeSingle();
  if (existing?.status === "archived") {
    return false;
  }

  if (
    dedupIndex &&
    !dedupIndex.slugs.has(opportunity.slug) &&
    isBlockedByDedupIndex(dedupIndex, {
      slug: opportunity.slug,
      name: opportunity.name,
      url: opportunity.url,
    })
  ) {
    return false;
  }

  const row = {
    ...toOpportunityRow(opportunity),
    status: "published",
    published_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("opportunities")
    .upsert(row, { onConflict: "slug" });
  if (error) throw new Error(`Upsert opportunity : ${error.message}`);
  if (dedupIndex) {
    registerOpportunityInDedupIndex(dedupIndex, {
      slug: opportunity.slug,
      name: opportunity.name,
      url: opportunity.url,
    });
  }
  if (runId) {
    const before = await getRunWrittenCount(supabase, runId);
    await appendRunWrittenSlug(supabase, runId, opportunity.slug, structuredCount, maxCount);
    const after = await getRunWrittenCount(supabase, runId);
    return after > before;
  }
  return true;
}

/** Étape A + filtrage : collecte des leads valides, avec over-fetch et 2nd round. */
async function collectLeads(opts: {
  count: number;
  sector?: string;
  originCountry: SourcingCountry;
  existingSlugs: Set<string>;
  existingNames: Set<string>;
  existingUrls: Set<string>;
  domainToSlug: Map<string, string>;
  tracker: CostTracker;
  log: LogFn;
  discoveryModel: string;
  nicheHints?: string[];
  maxLeads?: number;
  maxRounds?: number;
  shouldCancel?: () => Promise<boolean>;
  onDiscoveryProgress?: (discovered: number) => Promise<void>;
}): Promise<FactualLead[]> {
  const {
    count,
    sector,
    originCountry,
    existingSlugs,
    existingNames,
    existingUrls,
    domainToSlug,
    tracker,
    log,
    discoveryModel,
    nicheHints,
    maxLeads = count,
    maxRounds = MAX_DISCOVERY_ROUNDS,
    shouldCancel,
    onDiscoveryProgress,
  } = opts;
  const targetCode = originCountry.code;
  const requested = resolveSourcingScale(count).discoveryRequest;
  const seenNames = new Set<string>();
  const selected: FactualLead[] = [];

  const dynamicExclusions = await loadDynamicExclusions(targetCode, sector);

  for (let round = 1; round <= maxRounds && selected.length < maxLeads; round++) {
    if (shouldCancel && (await shouldCancel())) {
      throw new SourcingCancelledError();
    }

    const exclusions = Array.from(existingNames)
      .concat(Array.from(seenNames))
      .concat(dynamicExclusions.productNames);

    const cached =
      round === 1
        ? await getCachedLeads(targetCode, sector, exclusions)
        : null;

    const leads =
      cached ??
      (await discoverLeads({
        count: requested,
        sector,
        originCountryCode: originCountry.code,
        originCountryName: originCountry.name,
        originFlag: originCountry.flag,
        exclusions,
        dynamicExclusions,
        nicheHints,
        variation: round > 1,
        tracker,
        model: discoveryModel,
      }));

    if (!cached && round === 1 && leads.length > 0) {
      await setCachedLeads(targetCode, sector, exclusions, leads);
    }

    log({ type: "round", round, leads: leads.length });
    await onDiscoveryProgress?.(selected.length);

    for (const lead of leads) {
      const slug = slugify(lead.name);
      const nameKey = lead.name.toLowerCase().trim();

      if (normalizeCountryCode(lead.originCountryCode) !== targetCode) {
        log({
          type: "lead-skip",
          name: lead.name,
          reason: `pays ${lead.originCountryCode} ≠ ${targetCode}`,
        });
        continue;
      }
      if (existingSlugs.has(slug) || existingNames.has(nameKey)) continue;
      if (seenNames.has(nameKey)) continue;
      if (sector && lead.sector !== sector) continue;

      if (!lead.url) {
        log({
          type: "lead-skip",
          name: lead.name,
          reason: "URL produit absente",
        });
        continue;
      }

      if (lead.url) {
        const urlKey = normalizeUrlKey(lead.url);
        if (existingUrls.has(urlKey)) continue;
        const domain = rootDomainFromUrl(lead.url);
        if (domain && domainToSlug.has(domain)) continue;
      }

      seenNames.add(nameKey);
      selected.push(lead);
      if (selected.length >= maxLeads) break;
    }
  }

  return selected.slice(0, maxLeads);
}

type BuildResult =
  | { ok: true; opportunity: Opportunity }
  | { ok: false; reason: string };

/**
 * Étape B + C + validation.
 * Retry Gemini UNIQUEMENT sur des erreurs que Gemini contrôle (analyticalSchema, ou
 * opportunityRawSchema portant sur des champs non calculés). Les erreurs sur des champs
 * CALCULÉS par assembleOpportunity (slug, id, scores.opportunity, cacChannels, mrr…) ne
 * déclenchent pas de re-prompt : elles sont logguées et la fiche est écartée.
 */
async function buildForLead(
  lead: FactualLead,
  ctx: {
    dbSlugs: Set<string>;
    batchSlugs: Set<string>;
    tracker: CostTracker;
    premium: boolean;
    structureModel: string;
    sourceCheck: SourceVerification;
    factVerification: FactVerification;
    minScore: number;
    catalogue: boolean;
  }
): Promise<BuildResult> {
  let feedback: string | undefined;
  const usePremium = ctx.premium;

  const factsCtx = {
    sourceVerified: ctx.sourceCheck.verified,
    factConfidence: ctx.factVerification.confidence,
    tractionCount: lead.tractionSignals.length,
    tractionCategoriesCovered: countCoveredCategories(assessTractionQuality(lead)),
    verificationLevel: ctx.sourceCheck.verificationLevel,
    validUrlCount: ctx.sourceCheck.validCount,
    invalidUrlCount: ctx.sourceCheck.invalidUrls.length,
    countryMismatch: detectCountryMismatch(lead),
  };

  for (let attempt = 1; attempt <= (ctx.catalogue ? 1 : 2); attempt++) {
    let raw: unknown;
    try {
      raw = await structureLead(lead, ctx.tracker, {
        zodFeedback: feedback,
        premium: usePremium,
        model: ctx.structureModel,
      });
    } catch (err) {
      feedback = err instanceof Error ? err.message : String(err);
      continue;
    }

    const analytical = analyticalSchema.safeParse(raw);
    if (!analytical.success) {
      feedback = formatZodError(analytical.error);
      continue;
    }

    if (!ctx.catalogue && !analytical.data.buildableUnder30Days) {
      return {
        ok: false,
        reason:
          "non buildable en 30j par un solo dev — produit trop large (plateforme/suite) ; écarté",
      };
    }

    const prudentScenario =
      analytical.data.financialScenarios.find((s) => s.name === "Prudent") ??
      analytical.data.financialScenarios[0];
    const optimisteScenario =
      analytical.data.financialScenarios.find((s) => s.name === "Optimiste") ??
      analytical.data.financialScenarios[analytical.data.financialScenarios.length - 1];

    const earlyScore = previewOpportunityScore({
      rawSubScores: analytical.data.subScores,
      subScoreRationales: analytical.data.subScoreRationales,
      coherence: {
        subScores: analytical.data.subScores,
        franceCompetition: analytical.data.franceCompetition,
        buildableUnder30Days: analytical.data.buildableUnder30Days,
        techComplexity: analytical.data.techComplexity,
        problemExists: analytical.data.franceFitCriteria.problemExists,
        prudentMrr: Math.round(prudentScenario.clients * prudentScenario.avgPrice),
        optimisteMrr: Math.round(optimisteScenario.clients * optimisteScenario.avgPrice),
      },
      facts: {
        ...factsCtx,
        techComplexity: analytical.data.techComplexity,
        franceCompetition: analytical.data.franceCompetition,
      },
    });
    if (!ctx.catalogue && ctx.minScore > 0 && earlyScore < ctx.minScore - 10) {
      return {
        ok: false,
        reason: `early exit score ${earlyScore} < ${ctx.minScore - 10}`,
      };
    }

    const opportunity = assembleOpportunity(lead, analytical.data, {
      dbSlugs: ctx.dbSlugs,
      batchSlugs: ctx.batchSlugs,
      facts: {
        ...factsCtx,
        techComplexity: analytical.data.techComplexity,
        franceCompetition: analytical.data.franceCompetition,
      },
    });

    const validated = opportunityRawSchema.safeParse(opportunity);
    if (validated.success) {
      return { ok: true, opportunity };
    }

    // Validation finale échouée : ne re-prompter Gemini QUE si l'erreur porte sur un
    // champ qu'il contrôle. Sinon (champ calculé côté code) → skip + log, pas de retry.
    if (hasGeminiFixableError(validated.error)) {
      feedback = formatZodError(validated.error);
      continue;
    }
    return {
      ok: false,
      reason: `validation finale (champs calculés) : ${formatZodError(validated.error)}`,
    };
  }

  return { ok: false, reason: feedback ?? "raison inconnue" };
}

/**
 * Orchestration complète du sourcing, réutilisable depuis le CLI et l'API admin.
 * Mode draft par défaut ; auto-publication selon sourcing_settings.
 */
export async function runSourcing(options: RunOptions): Promise<RunReport> {
  const log = options.onLog ?? consoleLogger();
  const premium = options.premium ?? false;
  const catalogue = isCatalogueProfile(options);
  const minScore = catalogue ? 0 : (options.minScore ?? getMinScore());
  const settings = await loadPublishSettings();
  const mode = options.mode ?? settings.default_mode ?? "direct";
  const countryCode = normalizeCountryCode(
    options.originCountryCode ?? DEFAULT_SOURCING_COUNTRY
  );
  const originCountry = await assertValidCountryCode(countryCode);
  const startedAt = new Date().toISOString();
  const skipped: RunSkip[] = [];
  const events: SourcingEvent[] = [];
  const onLog: LogFn = (event) => {
    events.push(event);
    log(event);
  };

  onLog({ type: "start", count: options.count, sector: options.sector, premium, country: originCountry.code });

  await assertWithinMonthlyCostCap();

  const supabase = createAdminClient();
  const discoveryModel = settings.discovery_model ?? MODELS.discovery;
  const structureModel = settings.structure_model ?? MODELS.structure;
  const verifyModel = MODELS.verify;
  const scale = resolveSourcingScale(options.count);
  const runConfig = withPromptVersion({
    ...(options.config ?? {}),
    discoveryModel,
    structureModel,
  });
  const maxCostUsd = options.maxCostUsd;
  const markRunError = options.markRunError !== false;
  const tracker = new CostTracker();
  const runId =
    options.runId !== undefined
      ? options.runId
      : options.persistRun === false
        ? null
        : await insertRunRecord(supabase, {
            requested: options.count,
            sector: options.sector,
            premium,
            originCountryCode: originCountry.code,
            startedAt,
            triggeredBy: options.triggeredBy,
            config: runConfig,
          });

  try {
    return await execute();
  } catch (err) {
    if (markRunError) {
      const costUsd = tracker.totalCostUsd();
      const tokens = tracker.totalTokens();
      await failRunRecord(
        supabase,
        runId,
        err instanceof Error ? err.message : String(err),
        {
          events,
          costUsd: costUsd > 0 ? costUsd : undefined,
          tokensInput: tokens.input,
          tokensOutput: tokens.output,
        }
      );
    }
    throw err;
  }

  async function execute(): Promise<RunReport> {
  const shouldCancel = runId ? () => isRunCancelRequested(runId) : undefined;
  const assertNotCancelled = async () => {
    if (shouldCancel && (await shouldCancel())) {
      throw new SourcingCancelledError();
    }
  };
  const incrementalDirect = mode === "direct" && runId != null;
  const writeTarget = options.count;
  let writtenCount =
    incrementalDirect && runId ? await getRunWrittenCount(supabase, runId) : 0;
  let structuredCount = 0;
  const processConcurrency = 1;

  const syncProgress = async (
    patch: Partial<{
      count_discovered: number;
      count_structured: number;
      count_written: number;
    }>
  ) => {
    if (!runId) return;
    await patchRunProgress(supabase, runId, {
      ...patch,
      events: events.slice(-50),
    });
  };

  try {
  await assertModelsActive([discoveryModel, structureModel]);
  onLog({ type: "models-ok", models: [discoveryModel, structureModel] });

  const dedupIndex = await loadExistingForDedup(supabase);
  const { slugs: existingSlugs, names: existingNames, urls: existingUrls, domainToSlug } =
    dedupIndex;
  onLog({ type: "existing-loaded", count: existingSlugs.size });

  const nicheHints =
    (options.config?.nicheHints as string[] | undefined) ??
    ((options.config?.scheduleConfig as { nicheHints?: string[] })?.nicheHints);

  const selected = await collectLeads({
    count: options.count,
    sector: options.sector,
    originCountry,
    existingSlugs,
    existingNames,
    existingUrls,
    domainToSlug,
    tracker,
    log: onLog,
    discoveryModel,
    nicheHints,
    maxLeads: scale.maxLeads,
    maxRounds: scale.maxRounds,
    shouldCancel,
    onDiscoveryProgress: runId
      ? async (discovered) => syncProgress({ count_discovered: discovered })
      : undefined,
  });
  onLog({ type: "leads-selected", count: selected.length });
  await syncProgress({ count_discovered: selected.length });

  const batchSlugs = new Set<string>();
  type ProcessedLead = {
    opportunity: Opportunity;
    lead: FactualLead;
    sourceCheck: SourceVerification;
    factVerification: FactVerification;
    needsReview: boolean;
    premiumVerified: boolean | null;
  };

  const processed = await mapWithConcurrency(selected, processConcurrency, async (rawLead) => {
    await assertNotCancelled();
    if (writtenCount >= writeTarget) {
      return null;
    }
    if (maxCostUsd != null && tracker.totalCostUsd() >= maxCostUsd) {
      return null;
    }

    let lead = rawLead;
    let tractionReport = assessTractionQuality(lead);
    let tractionStillMissing = tractionReport.missing;

    if (needsTractionEnrichment(tractionReport)) {
      const enriched = await enrichTractionSignals(lead, tractionReport, tracker, verifyModel);
      await assertNotCancelled();
      lead = enriched.lead;
      tractionReport = assessTractionQuality(lead);
      tractionStillMissing = enriched.stillMissing;
      onLog({
        type: "traction-enriched",
        name: lead.name,
        addedSignals: enriched.addedSignals,
        stillMissing: enriched.stillMissing,
        countryMismatch: enriched.countryMismatch,
      });
    } else {
      lead = normalizeLead(lead);
      tractionReport = assessTractionQuality(lead);
      tractionStillMissing = tractionReport.missing;
    }

    const sourceCheck: SourceVerification = await verifyLeadSources(lead);
    await assertNotCancelled();
    if (!catalogue && !passesUrlGate(sourceCheck)) {
      const reason = !sourceCheck.productUrlValid
        ? "URL produit injoignable"
        : !sourceCheck.productCrossCheckOk
          ? "URL produit non vérifiée (domaine parqué ou incohérent)"
          : "URL produit absente";
      skipped.push({ name: lead.name, reason });
      onLog({ type: "lead-skip", name: lead.name, reason });
      return null;
    }

    if (!catalogue) {
      lead = pruneTractionSignals(lead, sourceCheck.validUrls);
      lead = normalizeLead(lead);
      tractionReport = assessTractionQuality(lead);
      tractionStillMissing = tractionReport.missing;

      const tractionGate = passesTractionGate(lead);
      if (!tractionGate.ok) {
        skipped.push({ name: lead.name, reason: tractionGate.reason ?? "traction non sourcable" });
        onLog({
          type: "lead-skip",
          name: lead.name,
          reason: tractionGate.reason ?? "traction non sourcable",
        });
        return null;
      }
    }

    const inferredFacts = inferFactVerificationFromSources(lead, sourceCheck);
    const factVerification: FactVerification =
      inferredFacts ??
      (catalogue
        ? {
            confidence: "medium",
            confirmed: true,
            tractionVerified: true,
            countryConsistent: !detectCountryMismatch(lead),
          }
        : await verifyLeadFacts(lead, tracker, verifyModel));
    await assertNotCancelled();
    const needsReview =
      !catalogue &&
      (factVerification.confidence === "medium" ||
        !factVerification.tractionVerified ||
        tractionStillMissing.length > 0);

    if (!catalogue) {
      const factGate = passesFactCheckGate(factVerification);
      if (!factGate.ok) {
        skipped.push({ name: lead.name, reason: factGate.reason ?? "fact-check Sonar négatif" });
        onLog({
          type: "lead-skip",
          name: lead.name,
          reason: factGate.reason ?? "fact-check Sonar négatif",
        });
        return null;
      }
    }

    const result = await buildForLead(lead, {
      dbSlugs: existingSlugs,
      batchSlugs,
      tracker,
      premium,
      structureModel,
      sourceCheck,
      factVerification,
      minScore,
      catalogue,
    });
    await assertNotCancelled();

    if (!result.ok) {
      skipped.push({ name: lead.name, reason: result.reason });
      onLog({ type: "lead-skip", name: lead.name, reason: result.reason });
      return null;
    }

    const { opportunity } = result;

    const avgMrr = await loadMarketAvgMrr(supabase, opportunity.originCountryCode);
    const mrrIssue = catalogue ? null : checkMrrSanity(opportunity, avgMrr);
    if (mrrIssue) {
      skipped.push({ name: opportunity.name, reason: mrrIssue });
      onLog({ type: "lead-skip", name: opportunity.name, reason: mrrIssue });
      return null;
    }

    if (!catalogue && minScore > 0 && !meetsScoreGate(opportunity, minScore)) {
      skipped.push({
        name: opportunity.name,
        reason: `score ${opportunity.scores.opportunity} < seuil ${minScore}`,
      });
      onLog({
        type: "score-gate-skip",
        name: opportunity.name,
        slug: opportunity.slug,
        score: opportunity.scores.opportunity,
        min: minScore,
      });
      return null;
    }

    batchSlugs.add(opportunity.slug);
    onLog({
      type: "lead-ok",
      name: opportunity.name,
      slug: opportunity.slug,
      score: opportunity.scores.opportunity,
    });

    structuredCount++;
    await syncProgress({
      count_discovered: selected.length,
      count_structured: structuredCount,
      count_written: writtenCount,
    });

    if (incrementalDirect) {
      const published = await persistDirectOpportunity(
        supabase,
        opportunity,
        runId,
        structuredCount,
        writeTarget,
        dedupIndex
      );
      if (published) {
        writtenCount = await getRunWrittenCount(supabase, runId!);
        await syncProgress({
          count_discovered: selected.length,
          count_structured: structuredCount,
          count_written: writtenCount,
        });
        if (options.revalidate !== false && writtenCount === 1) {
          await triggerRevalidation();
        }
      }
    }

    if (writtenCount >= writeTarget) {
      return null;
    }

    return {
      opportunity,
      lead,
      sourceCheck,
      factVerification,
      needsReview,
      premiumVerified: premium ? verifyPremiumFields(opportunity) : null,
    } satisfies ProcessedLead;
  });

  const opportunities: Opportunity[] = [];
  const leadBySlug = new Map<string, FactualLead>();
  const metaBySlug = new Map<
    string,
    {
      sourceCheck: SourceVerification;
      factVerification: FactVerification;
      needsReview: boolean;
      premiumVerified: boolean | null;
    }
  >();

  for (const item of processed) {
    if (!item) continue;
    if (opportunities.length >= writeTarget) break;
    opportunities.push(item.opportunity);
    leadBySlug.set(item.opportunity.slug, item.lead);
    metaBySlug.set(item.opportunity.slug, {
      sourceCheck: item.sourceCheck,
      factVerification: item.factVerification,
      needsReview: item.needsReview,
      premiumVerified: item.premiumVerified,
    });
  }

  const costLine = tracker.formatCostLine();
  const costUsd = tracker.totalCostUsd();
  const tokens = tracker.totalTokens();
  const finishExtras = {
    costUsd: costUsd > 0 ? costUsd : undefined,
    tokensInput: tokens.input,
    tokensOutput: tokens.output,
    events,
  };

  const baseReport: Omit<RunReport, "status" | "finishedAt"> = {
    startedAt,
    requested: options.count,
    sector: options.sector,
    premium,
    discovered: selected.length,
    structured: opportunities.length,
    written: 0,
    skipped,
    costLine,
  };

  if (opportunities.length === 0) {
    onLog({ type: "warn", message: "Aucune fiche valide produite — rien à écrire." });
    onLog({ type: "done", written: 0, requested: options.count, costLine });
    const report: RunReport = {
      ...baseReport,
      written: 0,
      status: "empty",
      finishedAt: new Date().toISOString(),
    };
    await finishRunRecord(supabase, runId, report, finishExtras);
    await recordRunMetrics(report, { costUsd });
    return report;
  }

  if (opportunities.length < options.count) {
    onLog({
      type: "warn",
      message: `seulement ${opportunities.length}/${options.count} fiche(s) produite(s).`,
    });
  }

  if (mode === "draft") {
    let verifiedCount = 0;
    const draftRows = opportunities.map((opp) => {
      const meta = metaBySlug.get(opp.slug);
      const sourceVerified = meta?.sourceCheck.verified === true;
      if (sourceVerified) verifiedCount++;
      return {
        source_run_id: runId,
        slug: opp.slug,
        name: opp.name,
        payload: { ...opp, sourceVerified },
        score: opp.scores.opportunity,
        status: "pending",
        dedup_matches: findDedupMatches(opp, dedupIndex),
        source_lead: leadBySlug.get(opp.slug) ?? null,
        source_verified: sourceVerified,
        invalid_urls: meta?.sourceCheck.invalidUrls ?? [],
        verification_level: meta?.sourceCheck.verificationLevel ?? "none",
        needs_review: meta?.needsReview === true,
        fact_confidence: meta?.factVerification.confidence ?? null,
        premium_verified: meta?.premiumVerified ?? null,
      };
    });
    const { data: inserted, error } = await supabase
      .from("opportunity_drafts")
      .insert(draftRows)
      .select("id");
    if (error) throw new Error(`Insert drafts : ${error.message}`);

    const draftIds = (inserted ?? []).map((d) => d.id as string);
    if (draftIds.length > 0) {
      const autoResults = await processDraftsAutoPublish({
        draftIds,
        runPremium: premium,
        triggeredBy: options.triggeredBy,
      });
      const autoPublished = autoResults.filter((r) => r.published).length;
      if (autoPublished > 0) {
        onLog({
          type: "warn",
          message: `${autoPublished} brouillon(s) auto-publié(s) selon les règles configurées.`,
        });
        if (options.revalidate !== false) {
          await triggerRevalidation();
        }
      }
      await notifyPendingDraftsIfEnabled(runId);
    }

    onLog({ type: "upsert-ok", count: draftRows.length });
    onLog({ type: "done", written: draftRows.length, requested: options.count, costLine });
    const report: RunReport = {
      ...baseReport,
      written: draftRows.length,
      status: opportunities.length < options.count ? "partial" : "ok",
      finishedAt: new Date().toISOString(),
    };
    await finishRunRecord(supabase, runId, report, finishExtras);
    await recordRunMetrics(report, { costUsd, verifiedDrafts: verifiedCount });
    return report;
  }

  const rows = opportunities.map(toOpportunityRow);
  const rowsWithStatus = rows.map((r) => ({
    ...r,
    status: "published",
    published_at: new Date().toISOString(),
  }));

  if (!incrementalDirect) {
    const { error: upsertError } = await supabase
      .from("opportunities")
      .upsert(rowsWithStatus.slice(0, writeTarget), { onConflict: "slug" });
    if (upsertError) {
      throw new Error(`Upsert opportunities : ${upsertError.message}`);
    }
    onLog({ type: "upsert-ok", count: Math.min(rows.length, writeTarget) });
  } else {
    onLog({ type: "upsert-ok", count: writtenCount });
  }

  if (options.manageWeeklyPick === true) {
    const best = [...opportunities].sort(
      (a, b) => b.scores.opportunity - a.scores.opportunity
    )[0];
    if (best) await promoteWeeklyPick(supabase, best.slug, onLog);
  }

  const finalWritten = incrementalDirect
    ? Math.min(writtenCount, writeTarget)
    : Math.min(rows.length, writeTarget);

  onLog({ type: "done", written: finalWritten, requested: options.count, costLine });

  if (options.revalidate !== false) {
    await triggerRevalidation();
  }

  const report: RunReport = {
    ...baseReport,
    written: finalWritten,
    structured: Math.min(structuredCount, writeTarget),
    status: finalWritten < options.count ? "partial" : "ok",
    finishedAt: new Date().toISOString(),
  };
  await finishRunRecord(supabase, runId, report, finishExtras);
  await recordRunMetrics(report, { costUsd });
  return report;
  } catch (err) {
    if (err instanceof SourcingCancelledError) {
      if (runId && (await shouldDiscardOnCancel(runId))) {
        await discardRunOpportunities([runId]);
        writtenCount = 0;
      }

      onLog({ type: "warn", message: "Run annulé par l'utilisateur" });
      const costLine = tracker.formatCostLine();
      const costUsdVal = tracker.totalCostUsd();
      const tokens = tracker.totalTokens();
      const finishExtrasOnCancel = {
        costUsd: costUsdVal > 0 ? costUsdVal : undefined,
        tokensInput: tokens.input,
        tokensOutput: tokens.output,
        events,
      };
      const report: RunReport = {
        startedAt,
        requested: options.count,
        sector: options.sector,
        premium,
        discovered: 0,
        structured: Math.min(structuredCount, options.count),
        written: Math.min(writtenCount, options.count),
        skipped,
        costLine,
        status: writtenCount > 0 ? "partial" : "empty",
        finishedAt: new Date().toISOString(),
      };
      await finishRunRecord(supabase, runId, report, {
        ...finishExtrasOnCancel,
        error: "Annulé par l'utilisateur",
      });
      await recordRunMetrics(report, { costUsd: costUsdVal });
      throw err;
    }
    throw err;
  }
  }
}

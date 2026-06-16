import { createClient } from "@supabase/supabase-js";
import { toOpportunityRow } from "@/lib/supabase/mappers";
import type { Opportunity } from "@/types/opportunity";
import {
  MAX_DISCOVERY_ROUNDS,
  MODELS,
  OVERFETCH_FACTOR,
  OVERFETCH_MIN,
} from "./constants";
import { CostTracker, assertModelsActive } from "./openrouter";
import { discoverLeads } from "./discover";
import { structureLead } from "./structure";
import {
  assembleOpportunity,
  getMinScore,
  meetsScoreGate,
  slugify,
} from "./assemble";
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
} from "./logger";

export interface RunOptions {
  count: number;
  sector?: string;
  premium?: boolean;
  /** Seuil de score plancher. Si non fourni, lit SOURCING_MIN_SCORE. */
  minScore?: number;
  /** Logger d'événements. Défaut : console (CLI). */
  onLog?: LogFn;
  /** Déclenche la revalidation prod après upsert. Défaut : true. */
  revalidate?: boolean;
  /** Persiste le run dans la table sourcing_runs. Défaut : true (best-effort). */
  persistRun?: boolean;
  /** Promeut la meilleure fiche du batch en weekly_pick. Défaut : true. */
  manageWeeklyPick?: boolean;
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}

type Supabase = ReturnType<typeof createAdminClient>;

/** Crée la ligne sourcing_runs en début de run. Best-effort : ne bloque jamais le run. */
async function insertRunRecord(
  supabase: Supabase,
  opts: { requested: number; sector?: string; premium: boolean; startedAt: string }
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
  report: RunReport
): Promise<void> {
  if (!id) return;
  try {
    await supabase
      .from("sourcing_runs")
      .update({
        finished_at: report.finishedAt,
        status: report.status,
        count_discovered: report.discovered,
        count_structured: report.structured,
        count_written: report.written,
        cost_line: report.costLine,
        skipped: report.skipped,
      })
      .eq("id", id);
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
  message: string
): Promise<void> {
  if (!id) return;
  try {
    await supabase
      .from("sourcing_runs")
      .update({ finished_at: new Date().toISOString(), status: "error", error: message })
      .eq("id", id);
  } catch {
    // silencieux
  }
}

async function loadExisting(supabase: Supabase): Promise<{
  slugs: Set<string>;
  names: Set<string>;
}> {
  const { data, error } = await supabase.from("opportunities").select("slug,name");
  if (error) {
    throw new Error(`Lecture des fiches existantes : ${error.message}`);
  }
  const slugs = new Set<string>();
  const names = new Set<string>();
  for (const row of data ?? []) {
    if (row.slug) slugs.add(row.slug as string);
    if (row.name) names.add((row.name as string).toLowerCase().trim());
  }
  return { slugs, names };
}

/** Étape A + filtrage : collecte des leads valides, avec over-fetch et 2nd round. */
async function collectLeads(opts: {
  count: number;
  sector?: string;
  existingSlugs: Set<string>;
  existingNames: Set<string>;
  tracker: CostTracker;
  log: LogFn;
}): Promise<FactualLead[]> {
  const { count, sector, existingSlugs, existingNames, tracker, log } = opts;
  const requested = Math.max(count * OVERFETCH_FACTOR, OVERFETCH_MIN);
  const seenNames = new Set<string>();
  const selected: FactualLead[] = [];

  for (let round = 1; round <= MAX_DISCOVERY_ROUNDS && selected.length < count; round++) {
    const exclusions = Array.from(existingNames).concat(Array.from(seenNames));
    const leads = await discoverLeads({
      count: requested,
      sector,
      exclusions,
      variation: round > 1,
      tracker,
    });
    log({ type: "round", round, leads: leads.length });

    for (const lead of leads) {
      const slug = slugify(lead.name);
      const nameKey = lead.name.toLowerCase().trim();

      if (existingSlugs.has(slug) || existingNames.has(nameKey)) continue;
      if (seenNames.has(nameKey)) continue;
      if (sector && lead.sector !== sector) continue;

      seenNames.add(nameKey);
      selected.push(lead);
      if (selected.length >= count) break;
    }
  }

  return selected.slice(0, count);
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
  }
): Promise<BuildResult> {
  let feedback: string | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw: unknown;
    try {
      raw = await structureLead(lead, ctx.tracker, {
        zodFeedback: feedback,
        premium: ctx.premium,
      });
    } catch (err) {
      feedback = err instanceof Error ? err.message : String(err);
      continue;
    }

    const analytical = analyticalSchema.safeParse(raw);
    if (!analytical.success) {
      // Erreur sur un champ contrôlé par Gemini → retry avec feedback.
      feedback = formatZodError(analytical.error);
      continue;
    }

    if (!analytical.data.buildableUnder30Days) {
      return {
        ok: false,
        reason:
          "non buildable en 30j par un solo dev — produit trop large (plateforme/suite) ; écarté",
      };
    }

    const opportunity = assembleOpportunity(lead, analytical.data, {
      dbSlugs: ctx.dbSlugs,
      batchSlugs: ctx.batchSlugs,
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
 * Orchestration complète du sourcing, réutilisable depuis le CLI et une future API admin.
 * Publication DIRECTE (pas d'état draft) ; garde-fou qualité optionnel via minScore.
 */
export async function runSourcing(options: RunOptions): Promise<RunReport> {
  const log = options.onLog ?? consoleLogger();
  const premium = options.premium ?? false;
  const minScore = options.minScore ?? getMinScore();
  const startedAt = new Date().toISOString();
  const skipped: RunSkip[] = [];

  log({ type: "start", count: options.count, sector: options.sector, premium });

  const supabase = createAdminClient();
  const runId =
    options.persistRun === false
      ? null
      : await insertRunRecord(supabase, {
          requested: options.count,
          sector: options.sector,
          premium,
          startedAt,
        });

  try {
    return await execute();
  } catch (err) {
    await failRunRecord(supabase, runId, err instanceof Error ? err.message : String(err));
    throw err;
  }

  async function execute(): Promise<RunReport> {
  await assertModelsActive([MODELS.discovery, MODELS.structure]);
  log({ type: "models-ok", models: [MODELS.discovery, MODELS.structure] });

  const { slugs: existingSlugs, names: existingNames } = await loadExisting(supabase);
  log({ type: "existing-loaded", count: existingSlugs.size });

  const tracker = new CostTracker();

  const selected = await collectLeads({
    count: options.count,
    sector: options.sector,
    existingSlugs,
    existingNames,
    tracker,
    log,
  });
  log({ type: "leads-selected", count: selected.length });

  const batchSlugs = new Set<string>();
  const opportunities: Opportunity[] = [];

  for (const lead of selected) {
    const result = await buildForLead(lead, {
      dbSlugs: existingSlugs,
      batchSlugs,
      tracker,
      premium,
    });
    if (!result.ok) {
      skipped.push({ name: lead.name, reason: result.reason });
      log({ type: "lead-skip", name: lead.name, reason: result.reason });
      continue;
    }

    const { opportunity } = result;

    // Garde-fou qualité (publication directe) : rejet sous le seuil de score.
    if (minScore > 0 && !meetsScoreGate(opportunity, minScore)) {
      skipped.push({
        name: opportunity.name,
        reason: `score ${opportunity.scores.opportunity} < seuil ${minScore}`,
      });
      log({
        type: "score-gate-skip",
        name: opportunity.name,
        slug: opportunity.slug,
        score: opportunity.scores.opportunity,
        min: minScore,
      });
      continue;
    }

    batchSlugs.add(opportunity.slug);
    opportunities.push(opportunity);
    log({
      type: "lead-ok",
      name: opportunity.name,
      slug: opportunity.slug,
      score: opportunity.scores.opportunity,
    });
  }

  const costLine = tracker.formatCostLine();

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
    log({ type: "warn", message: "Aucune fiche valide produite — rien à écrire." });
    log({ type: "done", written: 0, requested: options.count, costLine });
    const report: RunReport = {
      ...baseReport,
      written: 0,
      status: "empty",
      finishedAt: new Date().toISOString(),
    };
    await finishRunRecord(supabase, runId, report);
    return report;
  }

  if (opportunities.length < options.count) {
    log({
      type: "warn",
      message: `seulement ${opportunities.length}/${options.count} fiche(s) produite(s).`,
    });
  }

  const rows = opportunities.map(toOpportunityRow);
  const { error } = await supabase
    .from("opportunities")
    .upsert(rows, { onConflict: "slug" });
  if (error) {
    throw new Error(`Upsert opportunities : ${error.message}`);
  }

  log({ type: "upsert-ok", count: rows.length });

  if (options.manageWeeklyPick !== false) {
    const best = [...opportunities].sort(
      (a, b) => b.scores.opportunity - a.scores.opportunity
    )[0];
    if (best) await promoteWeeklyPick(supabase, best.slug, log);
  }

  log({ type: "done", written: rows.length, requested: options.count, costLine });

  if (options.revalidate !== false) {
    await triggerRevalidation();
  }

  const report: RunReport = {
    ...baseReport,
    written: rows.length,
    status: opportunities.length < options.count ? "partial" : "ok",
    finishedAt: new Date().toISOString(),
  };
  await finishRunRecord(supabase, runId, report);
  return report;
  }
}

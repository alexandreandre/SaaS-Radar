/**
 * Usage : npm run sourcing -- --count=3 [--sector=healthcare]
 * Prérequis : .env.local avec OPENROUTER_API_KEY + Supabase (service role) + migration appliquée.
 *
 * Pipeline 2 temps : Sonar (recherche web factuelle) → Gemini (structuration) → Zod → upsert.
 */
import { rm } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { toOpportunityRow } from "../src/lib/supabase/mappers";
import type { Opportunity } from "../src/types/opportunity";
import {
  DEFAULT_COUNT,
  MAX_DISCOVERY_ROUNDS,
  MODELS,
  OVERFETCH_FACTOR,
  OVERFETCH_MIN,
} from "../src/lib/sourcing/constants";
import {
  CostTracker,
  assertModelsActive,
} from "../src/lib/sourcing/openrouter";
import { discoverLeads } from "../src/lib/sourcing/discover";
import { structureLead } from "../src/lib/sourcing/structure";
import { assembleOpportunity, slugify } from "../src/lib/sourcing/assemble";
import {
  analyticalSchema,
  formatZodError,
  opportunityRawSchema,
  type FactualLead,
} from "../src/lib/sourcing/schema";

interface Args {
  count: number;
  sector?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let count = DEFAULT_COUNT;
  let sector: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--count=")) {
      count = Number.parseInt(arg.slice("--count=".length), 10) || DEFAULT_COUNT;
    } else if (arg === "--count") {
      count = Number.parseInt(argv[++i] ?? "", 10) || DEFAULT_COUNT;
    } else if (arg.startsWith("--sector=")) {
      sector = arg.slice("--sector=".length);
    } else if (arg === "--sector") {
      sector = argv[++i];
    }
  }

  return { count, sector };
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local"
    );
  }
  return createClient(url, key);
}

type Supabase = ReturnType<typeof createAdminClient>;

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
}): Promise<FactualLead[]> {
  const { count, sector, existingSlugs, existingNames, tracker } = opts;
  const requested = Math.max(count * OVERFETCH_FACTOR, OVERFETCH_MIN);
  const seenNames = new Set<string>();
  const selected: FactualLead[] = [];

  for (let round = 1; round <= MAX_DISCOVERY_ROUNDS && selected.length < count; round++) {
    const exclusions = [...existingNames, ...seenNames];
    const leads = await discoverLeads({
      count: requested,
      sector,
      exclusions,
      variation: round > 1,
      tracker,
    });
    console.log(`🔎 round ${round} : ${leads.length} lead(s) bruts valides de Sonar`);

    for (const lead of leads) {
      const slug = slugify(lead.name);
      const nameKey = lead.name.toLowerCase().trim();

      if (existingSlugs.has(slug) || existingNames.has(nameKey)) continue; // déjà en DB
      if (seenNames.has(nameKey)) continue; // doublon intra-run
      if (sector && lead.sector !== sector) continue; // filet secteur

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

/** Étape B + C + validation, avec 1 retry Gemini citant l'erreur Zod. */
async function buildForLead(
  lead: FactualLead,
  ctx: { dbSlugs: Set<string>; batchSlugs: Set<string>; tracker: CostTracker }
): Promise<BuildResult> {
  let feedback: string | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw: unknown;
    try {
      raw = await structureLead(lead, ctx.tracker, feedback);
    } catch (err) {
      feedback = err instanceof Error ? err.message : String(err);
      continue;
    }

    const analytical = analyticalSchema.safeParse(raw);
    if (!analytical.success) {
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
    feedback = formatZodError(validated.error);
  }

  return { ok: false, reason: feedback ?? "raison inconnue" };
}

/** Purge le Data Cache fetch de Next (.next/cache/fetch-cache) pour refléter les upserts. */
async function purgeNextFetchCache(): Promise<void> {
  const fetchCacheDir = path.resolve(process.cwd(), ".next/cache/fetch-cache");
  try {
    await rm(fetchCacheDir, { recursive: true, force: true });
    console.log(
      "🔄 Cache de données Next purgé — les nouvelles fiches seront visibles au prochain chargement"
    );
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return;
    throw err;
  }
}

async function main(): Promise<void> {
  const { count, sector } = parseArgs();
  console.log(
    `🚀 Sourcing — count=${count}${sector ? `, sector=${sector}` : ""}`
  );

  await assertModelsActive([MODELS.discovery, MODELS.structure]);
  console.log(`✅ Modèles actifs : ${MODELS.discovery} + ${MODELS.structure}`);

  const supabase = createAdminClient();
  const { slugs: existingSlugs, names: existingNames } = await loadExisting(supabase);
  console.log(`📚 ${existingSlugs.size} fiche(s) déjà en DB (exclues du sourcing)`);

  const tracker = new CostTracker();

  const selected = await collectLeads({
    count,
    sector,
    existingSlugs,
    existingNames,
    tracker,
  });
  console.log(`🧮 ${selected.length} lead(s) retenu(s) après filtrage`);

  const batchSlugs = new Set<string>();
  const opportunities: Opportunity[] = [];

  for (const lead of selected) {
    const result = await buildForLead(lead, {
      dbSlugs: existingSlugs,
      batchSlugs,
      tracker,
    });
    if (!result.ok) {
      console.warn(`⏭️  skip "${lead.name}" — ${result.reason}`);
      continue;
    }
    batchSlugs.add(result.opportunity.slug);
    opportunities.push(result.opportunity);
    console.log(
      `🧠 structuré + ✅ validé "${result.opportunity.name}" ` +
        `(slug: ${result.opportunity.slug}, score: ${result.opportunity.scores.opportunity})`
    );
  }

  if (opportunities.length === 0) {
    console.warn("⚠️  Aucune fiche valide produite — rien à écrire.");
    console.log(tracker.formatCostLine());
    return;
  }

  if (opportunities.length < count) {
    console.warn(
      `⚠️  seulement ${opportunities.length}/${count} fiche(s) produite(s).`
    );
  }

  // Vérifie que chaque fiche passe le mapper avant l'upsert.
  const rows = opportunities.map(toOpportunityRow);

  const { error } = await supabase
    .from("opportunities")
    .upsert(rows, { onConflict: "slug" });
  if (error) {
    throw new Error(`Upsert opportunities : ${error.message}`);
  }

  for (const opp of opportunities) {
    console.log(`💾 écrit "${opp.name}" (slug: ${opp.slug})`);
  }
  console.log(`✅ Sourcing terminé — ${rows.length} fiche(s) écrite(s)`);
  console.log(tracker.formatCostLine());
  await purgeNextFetchCache();
}

main().catch((err) => {
  console.error("❌ Sourcing échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});

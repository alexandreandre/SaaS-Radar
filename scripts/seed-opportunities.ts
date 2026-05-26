/**
 * Usage : npm run seed
 * Prérequis : .env.local rempli + schéma appliqué dans Supabase
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { opportunities } from "../src/data/opportunities";

/** Client admin pour scripts CLI (hors Next — pas d'import de admin.ts / server-only) */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local"
    );
  }
  return createClient<Database>(url, key);
}

async function seed() {
  const supabase = createAdminClient();

  for (const opp of opportunities) {
    const { error } = await supabase.from("opportunities").upsert(
      {
        slug: opp.slug,
        name: opp.name,
        pitch: opp.pitch,
        origin_country: opp.originCountry,
        origin_country_code: opp.originCountryCode,
        origin_flag: opp.originFlag,
        sector: opp.sector,
        target_client: opp.targetClient,
        client_type: opp.clientType,
        tech_complexity: opp.techComplexity,
        france_competition: opp.franceCompetition,
        revenue_min: opp.revenueMin,
        revenue_max: opp.revenueMax,
        buildable_under_30_days: opp.buildableUnder30Days,
        boring_business: opp.boringBusiness,
        ai_powered: opp.aiPowered,
        low_competition: opp.lowCompetition,
        scores: opp.scores,
        france_fit_criteria: opp.franceFitCriteria,
        traction_signals: opp.tractionSignals,
        why_it_works: opp.whyItWorks,
        france_analysis: opp.franceAnalysis,
        financial_scenarios: opp.financialScenarios,
        cac_channels: opp.cacChannels,
        mvp_plan: opp.mvpPlan,
        claude_prompt: opp.claudePrompt,
        acquisition: opp.acquisition,
        entrepreneurs_building: opp.entrepreneursBuilding,
        foreign_inspiration: opp.foreignInspiration,
        weekly_pick: opp.weeklyPick ?? false,
        created_at: opp.createdAt,
      },
      { onConflict: "slug" }
    );

    if (error) console.error(`❌ ${opp.slug}:`, error.message);
    else console.log(`✅ ${opp.slug}`);
  }

  console.log("Seed terminé !");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Test isolé étape A (Sonar) — diagnostic over-fetch count=10.
 * Usage : SOURCING_DEBUG=1 tsx --env-file=.env.local scripts/test-discover-a.ts
 */
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_COUNT,
  MAX_DISCOVERY_ROUNDS,
  MODELS,
  OVERFETCH_FACTOR,
  OVERFETCH_MIN,
} from "../src/lib/sourcing/constants";
import { discoverLeads } from "../src/lib/sourcing/discover";
import { assertModelsActive, CostTracker } from "../src/lib/sourcing/openrouter";
import { getSupabaseUrl } from "../src/lib/supabase/env";

const TARGET_COUNT = Number.parseInt(process.env.TEST_COUNT ?? "10", 10) || 10;

async function loadExclusions(): Promise<string[]> {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key);
  const { data } = await supabase.from("opportunities").select("name");
  return (data ?? []).map((r) => (r.name as string).toLowerCase().trim());
}

async function main(): Promise<void> {
  process.env.SOURCING_DEBUG = "1";

  const requested = Math.max(TARGET_COUNT * OVERFETCH_FACTOR, OVERFETCH_MIN);
  console.log(`🧪 Test étape A seule — targetCount=${TARGET_COUNT}`);
  console.log(`   over-fetch: max(${TARGET_COUNT}*${OVERFETCH_FACTOR}, ${OVERFETCH_MIN}) = ${requested} leads demandés à Sonar`);
  console.log(`   (DEFAULT_COUNT=${DEFAULT_COUNT} pour référence)\n`);

  await assertModelsActive([MODELS.discovery]);

  const exclusions = await loadExclusions();
  console.log(`📚 ${exclusions.length} exclusion(s) depuis DB\n`);

  const tracker = new CostTracker();

  for (let round = 1; round <= MAX_DISCOVERY_ROUNDS; round++) {
    console.log(`\n══════ ROUND ${round} ══════`);
    const leads = await discoverLeads({
      count: requested,
      exclusions,
      variation: round > 1,
      tracker,
    });
    console.log(`🔎 round ${round} résultat: ${leads.length} lead(s) valides Zod`);
    if (leads.length > 0) {
      console.log(`   noms: ${leads.map((l) => l.name).join(", ")}`);
    }
  }

  console.log("\n" + tracker.formatCostLine());
}

main().catch((err) => {
  console.error("❌ Test discover échoué:", err instanceof Error ? err.message : err);
  process.exit(1);
});

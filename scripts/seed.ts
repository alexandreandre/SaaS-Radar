/**
 * Usage : npm run seed
 * Prérequis : .env.local rempli + migration 001_opportunities appliquée dans Supabase
 */
import { createClient } from "@supabase/supabase-js";
import { opportunities } from "../src/data/opportunities";
import { toOpportunityRow } from "../src/lib/supabase/mappers";

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

async function seed() {
  const supabase = createAdminClient();
  const slugs = opportunities.map((o) => o.slug);

  const { data: existing, error: fetchError } = await supabase
    .from("opportunities")
    .select("slug")
    .in("slug", slugs);

  if (fetchError) {
    throw new Error(`Lecture des slugs existants : ${fetchError.message}`);
  }

  const existingSlugs = new Set((existing ?? []).map((row) => row.slug));
  const toInsert = opportunities.filter((o) => !existingSlugs.has(o.slug)).length;
  const toUpdate = opportunities.length - toInsert;

  const rows = opportunities.map(toOpportunityRow);

  const { error: upsertError } = await supabase
    .from("opportunities")
    .upsert(rows, { onConflict: "slug" });

  if (upsertError) {
    throw new Error(`Upsert opportunities : ${upsertError.message}`);
  }

  console.log(`✅ Seed terminé — ${opportunities.length} fiches traitées`);
  console.log(`   • ${toInsert} insérée(s)`);
  console.log(`   • ${toUpdate} mise(s) à jour`);
}

seed().catch((err) => {
  console.error("❌ Seed échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});

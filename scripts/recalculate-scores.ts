/**
 * Recalcule les scores du catalogue publié (cohérence + hybride) sans re-appeler Gemini.
 *
 * Usage :
 *   npm run recalculate-scores           # dry-run (rapport uniquement)
 *   npm run recalculate-scores -- --apply # écrit en base
 */
import { mapRowToOpportunity } from "../src/lib/supabase/mappers";
import { recalculateOpportunityScores } from "../src/lib/scoring/recalculate";
import { createAdminClient } from "../src/lib/supabase/admin";
import type { OpportunityRow } from "../src/lib/supabase/types";

const apply = process.argv.includes("--apply");

async function main() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as OpportunityRow[];
  let changed = 0;

  console.log(`\n${apply ? "APPLY" : "DRY-RUN"} — ${rows.length} fiche(s) publiée(s)\n`);

  for (const row of rows) {
    const opp = mapRowToOpportunity(row);
    const nextScores = recalculateOpportunityScores(opp);
    const delta = nextScores.opportunity - opp.scores.opportunity;
    const subChanged =
      nextScores.franceFit !== opp.scores.franceFit ||
      nextScores.buildability !== opp.scores.buildability ||
      nextScores.margin !== opp.scores.margin ||
      nextScores.competitionGap !== opp.scores.competitionGap;

    if (delta !== 0 || subChanged) {
      changed++;
      console.log(
        `${opp.slug}: global ${opp.scores.opportunity} → ${nextScores.opportunity} (${delta >= 0 ? "+" : ""}${delta})`
      );
      if (nextScores._meta?.adjustments?.length) {
        for (const adj of nextScores._meta.adjustments) {
          console.log(`  ↳ ${adj}`);
        }
      }

      if (apply) {
        const { error: updateError } = await supabase
          .from("opportunities")
          .update({ scores: nextScores })
          .eq("id", opp.id);
        if (updateError) {
          console.error(`  ✗ échec update ${opp.slug}: ${updateError.message}`);
        }
      }
    }
  }

  console.log(`\n${changed} fiche(s) avec delta.${apply ? " Mises à jour en base." : " Relancez avec --apply pour persister."}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

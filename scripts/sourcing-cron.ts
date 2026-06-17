/**
 * Cron prod : lit sourcing_schedules et lance un run par pays + weekly pick optionnel.
 */
import { createClient } from "@supabase/supabase-js";
import { runSourcing } from "../src/lib/sourcing/run";
import { getSupabaseUrl } from "../src/lib/supabase/env";
import { getMinScore } from "../src/lib/sourcing/assemble";
import {
  assertValidCountryCodes,
  DEFAULT_SOURCING_COUNTRY,
} from "../src/lib/sourcing/countries";

function createAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis");
  }
  return createClient(url, key);
}

type ScheduleConfig = {
  weeklyPick?: boolean;
  nicheHints?: string[];
};

async function promoteBestWeeklyPick(admin: ReturnType<typeof createAdminClient>): Promise<void> {
  const { data } = await admin
    .from("opportunity_drafts")
    .select("slug, score, dedup_matches")
    .eq("status", "pending")
    .order("score", { ascending: false })
    .limit(5);

  const best = (data ?? []).find((d) => {
    const matches = (d.dedup_matches as { type: string }[] | null) ?? [];
    return !matches.some((m) => ["slug", "url", "domain"].includes(m.type));
  });

  if (!best?.slug) return;

  await admin.from("opportunities").update({ weekly_pick: false }).eq("weekly_pick", true);
  await admin
    .from("opportunities")
    .update({ weekly_pick: true })
    .eq("slug", best.slug as string);
  console.log(`Weekly pick promu : ${best.slug}`);
}

async function main(): Promise<void> {
  const admin = createAdminClient();

  const { data: schedules, error } = await admin
    .from("sourcing_schedules")
    .select("*")
    .eq("enabled", true)
    .limit(1);

  if (error) throw new Error(error.message);

  const schedule = schedules?.[0];
  if (!schedule) {
    console.log("Aucune planification sourcing active — exit 0");
    return;
  }

  const scheduleConfig = (schedule.config as ScheduleConfig | null) ?? {};
  const rawCodes = (schedule.country_codes as string[] | null) ?? [DEFAULT_SOURCING_COUNTRY];
  const countries = await assertValidCountryCodes(rawCodes);
  const minScore = schedule.min_score ?? getMinScore();

  console.log(
    `Planification : ${countries.length} pays × ${schedule.count} fiches — cron ${schedule.cron_expr}`
  );

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    console.log(`\n--- Run ${country.flag} ${country.name} (${country.code}) ---`);
    try {
      const report = await runSourcing({
        count: schedule.count,
        sector: schedule.sector ?? undefined,
        premium: true,
        minScore,
        mode: "draft",
        originCountryCode: country.code,
        manageWeeklyPick: false,
        revalidate: false,
        config: {
          nicheHints: scheduleConfig.nicheHints,
          scheduleConfig,
        },
      });
      console.log(
        `Terminé ${country.code} : ${report.status} — ${report.written}/${report.requested} écrit(s)`
      );
    } catch (err) {
      console.error(`Erreur ${country.code} :`, err instanceof Error ? err.message : err);
    }
  }

  if (scheduleConfig.weeklyPick === true) {
    await promoteBestWeeklyPick(admin);
  }

  await admin
    .from("sourcing_schedules")
    .update({ last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", schedule.id);

  console.log("\nCron sourcing terminé.");
}

main().catch((err) => {
  console.error("❌ Cron sourcing échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});

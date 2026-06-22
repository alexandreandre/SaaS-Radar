/**
 * Remet à zéro la campagne des projets LinguaFlow (test nouveau flux rivière).
 *
 * Usage :
 *   CONFIRM=1 npx tsx --env-file=.env.local scripts/reset-linguaflow-campaign.ts
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

type Row = {
  id: string;
  user_id: string;
  name: string;
  opportunity_slug: string | null;
  payload: Record<string, unknown>;
};

function isLinguaFlowProject(row: Row): boolean {
  const haystack = [row.name, row.opportunity_slug ?? "", JSON.stringify(row.payload ?? {})]
    .join(" ")
    .toLowerCase();
  return haystack.includes("linguaflow") || haystack.includes("lingua flow");
}

function resetCampaignPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const next = { ...payload };
  delete next.campaignSetup;
  delete next.campaignSetupHistory;
  delete next.marketingProfile;
  delete next.activeCampaignToolIds;
  return next;
}

async function main() {
  if (process.env.CONFIRM !== "1") {
    console.error("❌ Dry-run désactivé pour sécurité.");
    console.error("   CONFIRM=1 npx tsx --env-file=.env.local scripts/reset-linguaflow-campaign.ts");
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  });

  const { data: rows, error: fetchError } = await supabase
    .from("user_projects")
    .select("id, user_id, name, opportunity_slug, payload, phase, mrr_cents");

  if (fetchError) throw fetchError;

  const matches = (rows ?? []).filter((r) =>
    isLinguaFlowProject(r as Row),
  ) as (Row & { phase: string; mrr_cents: number })[];

  if (matches.length === 0) {
    console.log("ℹ️  Aucun projet LinguaFlow trouvé.");
    process.exit(0);
  }

  console.log(`\n🔍 ${matches.length} projet(s) LinguaFlow :\n`);
  for (const row of matches) {
    const setup = row.payload?.campaignSetup as Record<string, unknown> | undefined;
    const river = setup?.foundationsRiver as Record<string, unknown> | undefined;
    console.log(`  • ${row.name} (${row.id})`);
    console.log(`    slug: ${String(row.payload?.opportunitySlug ?? row.opportunity_slug ?? "—")}`);
    console.log(
      `    campagne: ${river?.completedAt ? "fondations OK" : river?.startedAt ? "rivière en cours" : setup ? "setup présent" : "vide"}`,
    );
  }

  console.log("\n♻️  Réinitialisation campagne…\n");

  for (const row of matches) {
    const payload = resetCampaignPayload(row.payload ?? {});
    const { error: upsertError } = await supabase.from("user_projects").upsert(
      {
        id: row.id,
        user_id: row.user_id,
        opportunity_slug:
          (typeof payload.opportunitySlug === "string" && payload.opportunitySlug) ||
          row.opportunity_slug,
        name: row.name,
        phase: row.phase,
        mrr_cents: row.mrr_cents,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (upsertError) throw upsertError;
    console.log(`  ✅ ${row.name} (${row.id})`);
  }

  console.log("\n✅ Terminé. Recharge l’onglet Campagne (hard refresh) pour le flux Fondations.\n");
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});

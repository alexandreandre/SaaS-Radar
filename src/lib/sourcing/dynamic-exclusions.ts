import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export type DynamicExclusions = {
  productNames: string[];
  nicheHints: string[];
};

/** Charge noms déjà publiés + niches couvertes pour enrichir le prompt Sonar. */
export async function loadDynamicExclusions(
  countryCode: string,
  sector?: string
): Promise<DynamicExclusions> {
  const admin = createAdminClient();
  if (!admin) return { productNames: [], nicheHints: [] };

  let query = admin
    .from("opportunities")
    .select("name, sector, pitch, origin_country_code")
    .eq("status", "published")
    .limit(80);

  if (sector) query = query.eq("sector", sector);

  const { data: opps } = await query;
  const filtered = (opps ?? []).filter(
    (o) =>
      !countryCode ||
      (o as { origin_country_code?: string }).origin_country_code?.toUpperCase() ===
        countryCode.toUpperCase()
  );

  const productNames = filtered
    .map((o) => (o as { name?: string }).name)
    .filter(Boolean) as string[];

  const nicheHints = filtered
    .slice(0, 15)
    .map((o) => {
      const row = o as { name?: string; pitch?: string; sector?: string };
      return `${row.name} (${row.sector}) — ${(row.pitch ?? "").slice(0, 60)}`;
    });

  const { data: rejected } = await admin
    .from("opportunity_drafts")
    .select("name, rejection_reason")
    .eq("status", "rejected")
    .not("rejection_reason", "is", null)
    .order("reviewed_at", { ascending: false })
    .limit(20);

  for (const row of rejected ?? []) {
    const name = (row as { name?: string }).name;
    if (name) productNames.push(name);
  }

  return {
    productNames: Array.from(new Set(productNames)).slice(0, 40),
    nicheHints,
  };
}

export function formatExclusionBlock(exclusions: DynamicExclusions): string {
  const lines: string[] = [];
  if (exclusions.productNames.length > 0) {
    lines.push(
      `Produits/niches DÉJÀ couverts dans notre catalogue — NE PAS reproposer : ${exclusions.productNames.slice(0, 25).join("; ")}.`
    );
  }
  if (exclusions.nicheHints.length > 0) {
    lines.push(
      `Angles déjà explorés (cherche des sous-niches adjacentes différentes) :\n${exclusions.nicheHints.slice(0, 8).join("\n")}`
    );
  }
  return lines.join("\n");
}

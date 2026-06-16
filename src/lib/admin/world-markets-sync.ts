import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity } from "@/types/opportunity";

/** Incrémente opportunity_slugs sur world_markets à la publication. */
export async function syncWorldMarketOnPublish(opportunity: Opportunity): Promise<void> {
  try {
    const admin = createAdminClient();
    const code = opportunity.originCountryCode?.toUpperCase();
    if (!code) return;

    const { data: market } = await admin
      .from("world_markets")
      .select("id, opportunity_slugs, new_this_month")
      .eq("code", code)
      .maybeSingle();

    if (!market) return;

    const slugs = Array.isArray(market.opportunity_slugs)
      ? (market.opportunity_slugs as string[])
      : [];
    if (slugs.includes(opportunity.slug)) return;

    await admin
      .from("world_markets")
      .update({
        opportunity_slugs: [...slugs, opportunity.slug],
        new_this_month: (Number(market.new_this_month) || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", market.id as string);
  } catch (err) {
    console.warn("[world_markets] sync ignoré:", err instanceof Error ? err.message : err);
  }
}

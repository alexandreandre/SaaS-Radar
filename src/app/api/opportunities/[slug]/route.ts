import { NextResponse } from "next/server";
import { getEnrichedOpportunityBySlug } from "@/lib/opportunities";
import { getTier } from "@/lib/auth";
import { gateOpportunityForTier } from "@/lib/opportunity-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Opportunité complète (tier-gated) — chargement lazy côté client. */
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const slug = params.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Slug requis" }, { status: 400 });
  }

  try {
    const [opportunity, tier] = await Promise.all([
      getEnrichedOpportunityBySlug(slug),
      getTier(),
    ]);
    if (!opportunity) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json(gateOpportunityForTier(opportunity, tier));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

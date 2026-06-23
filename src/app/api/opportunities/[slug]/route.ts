import { NextResponse } from "next/server";
import {
  getEnrichedOpportunityBySlug,
  getEnrichedOpportunityBySlugIncludingArchived,
} from "@/lib/opportunities";
import { getCurrentUser, getTier } from "@/lib/auth";
import { gateOpportunityForTier } from "@/lib/opportunity-access";
import { userHasProjectWithOpportunitySlug } from "@/lib/portfolio-sync";

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
    const [tier, user] = await Promise.all([getTier(), getCurrentUser()]);
    let opportunity = await getEnrichedOpportunityBySlug(slug);

    if (!opportunity && user) {
      const ownsProject = await userHasProjectWithOpportunitySlug(user.id, slug);
      if (ownsProject) {
        opportunity = await getEnrichedOpportunityBySlugIncludingArchived(slug);
      }
    }

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

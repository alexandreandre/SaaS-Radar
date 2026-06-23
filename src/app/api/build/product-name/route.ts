import { NextResponse } from "next/server";
import { getCurrentUser, getTier } from "@/lib/auth";
import { generateProductNameSuggestions } from "@/lib/ai/gemini";
import {
  buildProductNameSystemPrompt,
  buildProductNameUserPrompt,
} from "@/lib/build/product-name";
import {
  getEnrichedOpportunityBySlug,
  getEnrichedOpportunityBySlugIncludingArchived,
} from "@/lib/opportunities";
import { userHasProjectWithOpportunitySlug } from "@/lib/portfolio-sync";
import { cockpitApiGuard } from "@/lib/product-phase-api";
import { hasTier } from "@/lib/tier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cockpitBlocked = await cockpitApiGuard();
  if (cockpitBlocked) return cockpitBlocked;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const tier = await getTier();
  if (!hasTier(tier, "builder")) {
    return NextResponse.json(
      { error: "Plan Builder requis pour générer des noms" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const opportunitySlug =
    typeof b.opportunitySlug === "string" ? b.opportunitySlug.trim() : "";

  if (!opportunitySlug) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  let opportunity = await getEnrichedOpportunityBySlug(opportunitySlug);
  if (!opportunity) {
    const ownsProject = await userHasProjectWithOpportunitySlug(user.id, opportunitySlug);
    if (ownsProject) {
      opportunity = await getEnrichedOpportunityBySlugIncludingArchived(opportunitySlug);
    }
  }
  if (!opportunity) {
    return NextResponse.json({ error: "Opportunité introuvable" }, { status: 404 });
  }

  try {
    const generated = await generateProductNameSuggestions(
      buildProductNameSystemPrompt(),
      buildProductNameUserPrompt(opportunity),
    );
    return NextResponse.json({ suggestions: generated.suggestions.slice(0, 3) });
  } catch (err) {
    const message =
      err instanceof Error && !err.message.startsWith("[")
        ? err.message
        : "La génération a échoué. Réessayez dans quelques instants.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

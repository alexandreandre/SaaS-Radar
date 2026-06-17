import { NextResponse } from "next/server";
import { getCurrentUser, getTier } from "@/lib/auth";
import { generateDeployRecipeMarkdown } from "@/lib/ai/gemini";
import { buildDeployRecipePrompt } from "@/lib/build/prompt-templates";
import { getBuildTool } from "@/lib/build/tools";
import { getEnrichedOpportunityBySlug } from "@/lib/opportunities";
import { hasTier } from "@/lib/tier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const tier = await getTier();
  if (!hasTier(tier, "builder")) {
    return NextResponse.json({ error: "Plan Builder requis" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const opportunitySlug =
    typeof b.opportunitySlug === "string" ? b.opportunitySlug.trim() : "";
  const productName =
    typeof b.productName === "string" ? b.productName.trim() : "";
  const toolId = typeof b.toolId === "string" ? b.toolId.trim() : "";

  const tool = getBuildTool(toolId);
  const opportunity = await getEnrichedOpportunityBySlug(opportunitySlug);
  if (!tool || !opportunity || !productName) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  try {
    const markdown = await generateDeployRecipeMarkdown(
      "Tu rédiges des guides de déploiement courts en français, numérotés.",
      buildDeployRecipePrompt(opportunity, tool, productName),
    );
    return NextResponse.json({ markdown });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}

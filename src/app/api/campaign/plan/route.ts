import { NextResponse } from "next/server";
import { getCurrentUser, getTier } from "@/lib/auth";
import { cockpitApiGuard } from "@/lib/product-phase-api";
import { hasTier } from "@/lib/tier";
import { getCampaignTool } from "@/lib/campaign/tools";
import {
  buildStrategySystemPrompt,
  buildStrategyUserPrompt,
  type CampaignPromptContext,
} from "@/lib/campaign/prompts";
import { generateStrategyBriefJson } from "@/lib/campaign/generate-kit";
import { checkCampaignRateLimit } from "@/lib/campaign/rate-limit";
import { resolveCampaignOpportunity } from "@/lib/campaign/resolve-opportunity";
import { loadUserProject } from "@/lib/portfolio-sync";
import {
  buildActionItemsForStage,
  enrichActionsFromOpportunity,
} from "@/lib/campaign/actions";
import { recommendIcpSummary } from "@/lib/campaign/recommend";
import {
  parseMarketingProfile,
  parseAcquisitionStage,
  parseChannelKey,
  resolveSequenceForPlan,
} from "@/lib/campaign/api-context";

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
      { error: "Plan Builder requis pour générer un plan campagne" },
      { status: 403 },
    );
  }

  const rate = checkCampaignRateLimit(user.id);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Limite quotidienne atteinte", retryAfter: rate.retryAfter },
      { status: 429 },
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
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  const productName =
    typeof b.productName === "string" ? b.productName.trim() : "";
  const profile = parseMarketingProfile(b.profile);
  const channel = parseChannelKey(b.channelKey);
  const stage = parseAcquisitionStage(b.acquisitionStage) ?? "network";

  if (!profile || !channel || !productName) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const opportunity = await resolveCampaignOpportunity(
    user.id,
    opportunitySlug,
    projectId,
  );
  if (!opportunity) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const project = projectId ? await loadUserProject(user.id, projectId) : null;
  const productionUrl = project?.hostConnection?.productionUrl;

  const ctx: CampaignPromptContext = {
    opportunity,
    productName,
    tool: getCampaignTool("claude")!,
    channel,
    profile,
    productionUrl,
    language: "fr",
  };

  try {
    const generated = await generateStrategyBriefJson(
      buildStrategySystemPrompt("fr"),
      buildStrategyUserPrompt(ctx),
    );
    const actionItems = enrichActionsFromOpportunity(
      buildActionItemsForStage(stage, channel),
      opportunity,
      productName,
      channel,
    );
    return NextResponse.json({
      strategyBrief: generated.strategyBrief,
      positioning: generated.strategyBrief.split("\n")[0]?.slice(0, 160),
      icpSummary: recommendIcpSummary(opportunity),
      actionItems,
      activeSequenceId: resolveSequenceForPlan(stage, channel),
      channelKey: channel,
      acquisitionStage: stage,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "La génération a échoué. Réessayez.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

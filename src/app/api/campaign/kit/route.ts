import { NextResponse } from "next/server";
import { getCurrentUser, getTier } from "@/lib/auth";
import { cockpitApiGuard } from "@/lib/product-phase-api";
import { hasTier } from "@/lib/tier";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getCampaignTool } from "@/lib/campaign/tools";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { CampaignToolId } from "@/lib/campaign/tools";
import { isCampaignToolId } from "@/lib/campaign/tools";
import {
  buildKitSystemPrompt,
  buildKitUserPrompt,
  buildStrategySystemPrompt,
  buildStrategyUserPrompt,
  getStaticPromptForTool,
  type CampaignPromptContext,
} from "@/lib/campaign/prompts";
import {
  generateCampaignKitJson,
  generateStrategyBriefJson,
} from "@/lib/campaign/generate-kit";
import { checkCampaignRateLimit } from "@/lib/campaign/rate-limit";
import { resolveCampaignOpportunity } from "@/lib/campaign/resolve-opportunity";
import { loadUserProject } from "@/lib/portfolio-sync";
import type { CampaignKit } from "@/lib/campaign/kits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseProfile(raw: unknown): MarketingProfile | null {
  if (raw === "organic" || raw === "paid-light" || raw === "paid-scale") return raw;
  return null;
}

function parseChannel(raw: unknown): ExtendedChannelKey | null {
  const valid: ExtendedChannelKey[] = [
    "cold_email",
    "linkedin",
    "seo",
    "referral",
    "tiktok",
    "meta",
    "google",
  ];
  if (typeof raw === "string" && valid.includes(raw as ExtendedChannelKey)) {
    return raw as ExtendedChannelKey;
  }
  return null;
}

function parseLanguage(raw: unknown): "fr" | "en" {
  return raw === "en" ? "en" : "fr";
}

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
      { error: "Plan Builder requis pour générer un kit campagne" },
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
  const toolId = typeof b.toolId === "string" ? b.toolId.trim() : "";
  const profile = parseProfile(b.profile);
  const channel = parseChannel(b.channelKey);
  const language = parseLanguage(b.language);
  const strategyBrief =
    typeof b.strategyBrief === "string" ? b.strategyBrief.trim() : undefined;
  const contentAssetsValidated = Array.isArray(b.contentAssetsValidated)
    ? (b.contentAssetsValidated as import("@/lib/campaign/kits").CampaignContentAsset[])
    : undefined;

  if (!isCampaignToolId(toolId) || !profile || !channel || !productName) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const tool = getCampaignTool(toolId);
  if (!tool) {
    return NextResponse.json({ error: "Outil inconnu" }, { status: 400 });
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
  const validatedFromProject = project?.campaignSetup?.contentAssets
    ? Object.values(project.campaignSetup.contentAssets).filter((a) => a.confirmedAt)
    : undefined;

  let resolvedStrategyBrief =
    strategyBrief ?? project?.campaignSetup?.strategyBrief?.trim();

  const baseCtx: CampaignPromptContext = {
    opportunity,
    productName,
    tool,
    channel,
    profile,
    strategyBrief: resolvedStrategyBrief,
    productionUrl,
    language,
    contentAssetsValidated: contentAssetsValidated ?? validatedFromProject,
  };

  try {
    if (!resolvedStrategyBrief) {
      const strategyGenerated = await generateStrategyBriefJson(
        buildStrategySystemPrompt(language),
        buildStrategyUserPrompt({
          ...baseCtx,
          tool: getCampaignTool("claude")!,
        }),
      );
      resolvedStrategyBrief = strategyGenerated.strategyBrief;
    }

    const ctx: CampaignPromptContext = {
      ...baseCtx,
      strategyBrief: resolvedStrategyBrief,
    };

    const generated = await generateCampaignKitJson(
      buildKitSystemPrompt(language),
      buildKitUserPrompt(ctx),
    );

    const kit: CampaignKit = {
      toolId: toolId as CampaignToolId,
      channelKey: channel,
      profile,
      brief: generated.brief,
      primaryPrompt: generated.primaryPrompt,
      secondaryPrompts: generated.secondaryPrompts,
      distributionSteps: generated.distributionSteps,
      generatedAt: new Date().toISOString(),
      language,
      productName,
    };

    return NextResponse.json({
      ...kit,
      strategyBrief: resolvedStrategyBrief,
    });
  } catch {
    const ctx: CampaignPromptContext = {
      ...baseCtx,
      strategyBrief: resolvedStrategyBrief,
    };
    const staticPrompt = getStaticPromptForTool(ctx);
    if (staticPrompt) {
      const kit: CampaignKit = {
        toolId: toolId as CampaignToolId,
        channelKey: channel,
        profile,
        brief: `Kit ${tool.name} pour ${productName}`,
        primaryPrompt: staticPrompt,
        generatedAt: new Date().toISOString(),
        language,
        productName,
      };
      return NextResponse.json({
        ...kit,
        strategyBrief: resolvedStrategyBrief,
      });
    }
    return NextResponse.json(
      { error: "La génération a échoué. Réessayez dans quelques instants." },
      { status: 500 },
    );
  }
}

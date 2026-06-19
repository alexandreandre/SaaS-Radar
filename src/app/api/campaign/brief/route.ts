import { NextResponse } from "next/server";
import { getCurrentUser, getTier } from "@/lib/auth";
import { hasTier } from "@/lib/tier";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getCampaignTool, type MarketingProfile } from "@/lib/campaign/tools";
import {
  buildStrategySystemPrompt,
  buildStrategyUserPrompt,
  type CampaignPromptContext,
} from "@/lib/campaign/prompts";
import { generateStrategyBriefJson } from "@/lib/campaign/generate-kit";
import { checkCampaignRateLimit } from "@/lib/campaign/rate-limit";
import { resolveCampaignOpportunity } from "@/lib/campaign/resolve-opportunity";
import { loadUserProject } from "@/lib/portfolio-sync";

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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const tier = await getTier();
  if (!hasTier(tier, "builder")) {
    return NextResponse.json(
      { error: "Plan Builder requis pour générer un brief campagne" },
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
  const profile = parseProfile(b.profile);
  const channel = parseChannel(b.channelKey);
  const language = parseLanguage(b.language);

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
    language,
  };

  try {
    const generated = await generateStrategyBriefJson(
      buildStrategySystemPrompt(language),
      buildStrategyUserPrompt(ctx),
    );
    return NextResponse.json({
      strategyBrief: generated.strategyBrief,
      channelKey: channel,
      profile,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "La génération a échoué. Réessayez.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

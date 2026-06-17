import { NextResponse } from "next/server";
import { getCurrentUser, getTier } from "@/lib/auth";
import { generateBuildPromptJson } from "@/lib/ai/gemini";
import {
  buildSystemPrompt,
  buildUserPrompt,
  type BuildPromptContext,
} from "@/lib/build/prompt-templates";
import { getBuildTool, type BuildToolId } from "@/lib/build/tools";
import { getEnrichedOpportunityBySlug } from "@/lib/opportunities";
import { hasTier } from "@/lib/tier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TOOL_IDS = new Set<string>([
  "base44",
  "lovable",
  "bolt",
  "v0",
  "replit",
  "cursor",
  "claude-code",
  "windsurf",
]);

type PromptMode = "mvp" | `feature:${number}` | "regenerate";

function parseMode(raw: unknown): PromptMode {
  if (raw === "mvp" || raw === "regenerate") return raw;
  if (typeof raw === "string" && raw.startsWith("feature:")) {
    const n = parseInt(raw.slice("feature:".length), 10);
    if (!Number.isNaN(n) && n >= 0) return `feature:${n}`;
  }
  return "mvp";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const tier = await getTier();
  if (!hasTier(tier, "builder")) {
    return NextResponse.json(
      { error: "Plan Builder requis pour générer un prompt MVP" },
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
  const toolId = typeof b.toolId === "string" ? b.toolId.trim() : "";
  const mode = parseMode(b.mode);

  if (!opportunitySlug || !VALID_TOOL_IDS.has(toolId)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const tool = getBuildTool(toolId);
  if (!tool) {
    return NextResponse.json({ error: "Outil inconnu" }, { status: 400 });
  }

  const opportunity = await getEnrichedOpportunityBySlug(opportunitySlug);
  if (!opportunity) {
    return NextResponse.json({ error: "Opportunité introuvable" }, { status: 404 });
  }

  const featureIndex =
    mode.startsWith("feature:") ? parseInt(mode.slice("feature:".length), 10) : undefined;

  const ctx: BuildPromptContext = { opportunity, tool, featureIndex };
  const system = buildSystemPrompt();
  const userPrompt = buildUserPrompt(ctx);

  try {
    const generated = await generateBuildPromptJson(system, userPrompt);
    return NextResponse.json({
      toolId: tool.id as BuildToolId,
      mode,
      ...generated,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur de génération" },
      { status: 500 },
    );
  }
}

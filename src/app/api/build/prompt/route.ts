import { NextResponse } from "next/server";
import { getCurrentUser, getTier } from "@/lib/auth";
import { generateBuildPromptJson } from "@/lib/ai/gemini";
import {
  buildSystemPrompt,
  buildUserPrompt,
  type BuildPromptContext,
} from "@/lib/build/prompt-templates";
import { getInfraProfile, getInfraUiSummary } from "@/lib/build/infra-profile";
import {
  buildSetupGuideFromOpportunity,
  serializeSetupRecipe,
} from "@/lib/build/setup-guide";
import { parseBuildPromptLanguage } from "@/lib/build/prompt-language";
import { getBuildTool, type BuildToolId } from "@/lib/build/tools";
import { ideaBriefToOpportunity } from "@/lib/idea/to-opportunity";
import { loadUserProject } from "@/lib/portfolio-sync";
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
  "emergent",
  "cursor",
  "claude-code",
  "codex",
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
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  const productName =
    typeof b.productName === "string" ? b.productName.trim() : "";
  const toolId = typeof b.toolId === "string" ? b.toolId.trim() : "";
  const mode = parseMode(b.mode);
  const language = parseBuildPromptLanguage(b.language);

  if (!VALID_TOOL_IDS.has(toolId)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  if ((mode === "mvp" || mode === "regenerate") && !productName) {
    return NextResponse.json(
      { error: "Choisissez un nom de produit avant de générer le kit" },
      { status: 400 },
    );
  }

  const tool = getBuildTool(toolId);
  if (!tool) {
    return NextResponse.json({ error: "Outil inconnu" }, { status: 400 });
  }

  let opportunity = opportunitySlug
    ? await getEnrichedOpportunityBySlug(opportunitySlug)
    : null;

  if (!opportunity && projectId) {
    const project = await loadUserProject(user.id, projectId);
    if (project?.ideaBrief) {
      opportunity = ideaBriefToOpportunity(project.ideaBrief, project.id);
    }
  }

  if (!opportunity) {
    return NextResponse.json(
      { error: "Opportunité ou projet idée introuvable" },
      { status: 404 },
    );
  }

  const featureIndex =
    mode.startsWith("feature:") ? parseInt(mode.slice("feature:".length), 10) : undefined;

  const infraProfile = getInfraProfile(opportunity, tool);

  const ctx: BuildPromptContext = {
    opportunity,
    productName,
    tool,
    language,
    featureIndex,
    infraProfile,
  };
  const system = buildSystemPrompt(tool, language, infraProfile);
  const userPrompt = buildUserPrompt(ctx);

  try {
    const generated = await generateBuildPromptJson(system, userPrompt, {
      language,
      infraProfile,
      tool,
    });
    const { qualityWarnings, ...promptFields } = generated;
    const setupGuideSteps = buildSetupGuideFromOpportunity({
      tool,
      productName,
      opportunity,
      infraProfile,
      language,
    });
    const setupRecipe = serializeSetupRecipe(setupGuideSteps);

    return NextResponse.json({
      toolId: tool.id as BuildToolId,
      mode,
      language,
      ...promptFields,
      setupRecipe,
      generatedAt: new Date().toISOString(),
      infra: {
        summary: getInfraUiSummary(infraProfile, language),
        envVars: infraProfile.envVars,
        services: infraProfile.services,
        setupSteps: infraProfile.setupSteps,
        recommendedStack: infraProfile.recommendedStack,
        primaryBackend: infraProfile.primaryBackend,
        ...(qualityWarnings?.length ? { qualityWarnings } : {}),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error && !err.message.startsWith("[")
        ? err.message
        : "La génération a échoué. Réessayez dans quelques instants.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

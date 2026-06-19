import "server-only";

import { callOpenRouter, extractJsonObject } from "@/lib/sourcing/openrouter";
import { MODELS } from "@/lib/sourcing/constants";
import type { IdeaClarifyTurn } from "@/types/idea-brief";
import { clarifyResponseSchema } from "@/lib/idea/schema";

const CLARITY_THRESHOLD = 75;
const MAX_TURNS = 3;

export type ClarifyInput = {
  initialIdea: string;
  turns: IdeaClarifyTurn[];
};

export type ClarifyResult =
  | { status: "clarify"; question: string; suggestions: string[] }
  | { status: "ready"; summary: string };

function formatTurns(turns: IdeaClarifyTurn[]): string {
  if (turns.length === 0) return "Aucune clarification encore.";
  return turns
    .map((t, i) => `Q${i + 1}: ${t.question}\nR${i + 1}: ${t.answer}`)
    .join("\n\n");
}

export async function evaluateIdeaClarity(input: ClarifyInput): Promise<ClarifyResult> {
  const { initialIdea, turns } = input;

  if (turns.length >= MAX_TURNS) {
    return {
      status: "ready",
      summary: buildFallbackSummary(initialIdea, turns),
    };
  }

  const system = `Tu es un product strategist SaaS B2B/B2C pour le marché français.
Évalue si une idée de micro-SaaS est assez claire pour générer une fiche projet complète.
Réponds UNIQUEMENT en JSON valide avec les clés :
- clarityScore (0-100)
- missingDimensions (array parmi: "cible", "problème", "monétisation", "différenciation")
- question (string, UNE question max, en français, directe — omets si clarityScore >= 75)
- suggestions (array de 2-4 réponses courtes cliquables — omets si pas de question)
- summary (string, une phrase résumant l'idée — requis si clarityScore >= 75)

Règles :
- Pose la question la plus discriminante, pas une liste
- Ne pose pas de question si l'idée est déjà actionnable
- Ton sobre, pas de fluff`;

  const user = `Idée initiale :
"${initialIdea}"

Clarifications :
${formatTurns(turns)}

Tour actuel : ${turns.length + 1}/${MAX_TURNS}`;

  const result = await callOpenRouter({
    model: MODELS.structure,
    system,
    user,
    responseFormat: { type: "json_object" },
    temperature: 0.25,
  });

  const parsed = clarifyResponseSchema.parse(extractJsonObject(result.content));

  if (parsed.clarityScore >= CLARITY_THRESHOLD || turns.length + 1 >= MAX_TURNS) {
    return {
      status: "ready",
      summary: parsed.summary?.trim() || buildFallbackSummary(initialIdea, turns),
    };
  }

  if (!parsed.question?.trim()) {
    return {
      status: "ready",
      summary: parsed.summary?.trim() || buildFallbackSummary(initialIdea, turns),
    };
  }

  return {
    status: "clarify",
    question: parsed.question.trim(),
    suggestions: parsed.suggestions?.slice(0, 4) ?? [],
  };
}

function buildFallbackSummary(initialIdea: string, turns: IdeaClarifyTurn[]): string {
  const extras = turns.map((t) => t.answer.trim()).filter(Boolean);
  if (extras.length === 0) return initialIdea.trim();
  return `${initialIdea.trim()} — ${extras.join(" ; ")}`;
}

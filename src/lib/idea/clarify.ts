import "server-only";

import { callOpenRouter, extractJsonObject } from "@/lib/sourcing/openrouter";
import { MODELS } from "@/lib/sourcing/constants";
import { normalizeSuggestions, resolveQuestionType } from "@/lib/idea/clarify-utils";
import type {
  IdeaClarifyPrompt,
  IdeaClarifyTurn,
} from "@/types/idea-brief";
import { clarifyResponseSchema } from "@/lib/idea/schema";

const CLARITY_THRESHOLD = 75;
const MAX_TURNS = 4;

export type ClarifyInput = {
  initialIdea: string;
  turns: IdeaClarifyTurn[];
};

export type ClarifyResult =
  | ({ status: "clarify" } & IdeaClarifyPrompt)
  | { status: "ready"; summary: string };

function formatTurns(turns: IdeaClarifyTurn[]): string {
  if (turns.length === 0) return "Aucune clarification encore.";
  return turns
    .map((t, i) => {
      const meta = [t.dimension, t.questionType].filter(Boolean).join(" · ");
      const header = meta ? `Q${i + 1} (${meta})` : `Q${i + 1}`;
      return `${header}: ${t.question}\nR${i + 1}: ${t.answer}`;
    })
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

  const system = `Tu es un product strategist senior spécialisé micro-SaaS pour le marché français.
Ta mission : décider si une idée est assez claire pour générer une fiche projet complète (cible, problème, monétisation, différenciation).

Réponds UNIQUEMENT en JSON valide avec ces clés :
- clarityScore (0-100, score global)
- dimensionScores (objet optionnel avec cible, problème, monétisation, différenciation — chacun 0-100)
- missingDimensions (array parmi: "cible", "problème", "monétisation", "différenciation")
- insight (string, 1 phrase max — ce que tu as déjà compris de l'idée, ton sobre — omets si clarityScore >= 75)
- targetDimension (string — la dimension visée par ta prochaine question)
- question (string — UNE question en français, directe — omets si clarityScore >= 75)
- questionType ("single" | "multi" | "open")
- suggestions (array de 0 à 5 objets { id, label, hint? } — options cliquables contextualisées à l'idée)
- allowCustom (boolean — true si une réponse libre reste pertinente)
- summary (string — 1 phrase actionnable résumant l'idée enrichie — requis si clarityScore >= 75)

Stratégie de question (très important) :
1. Analyse d'abord ce qui est DÉJÀ implicite dans l'idée — ne redemande pas l'évident.
2. Priorise la dimension la moins claire avec le plus fort impact sur la fiche projet.
3. Choisis le format adapté :
   - "single" : désambiguïser entre 2-4 options exclusives (ex. B2B vs B2C, abonnement vs commission, persona principale).
   - "multi" : plusieurs réponses possibles (ex. segments cibles, canaux d'acquisition, pain points prioritaires) — l'utilisateur peut en cocher plusieurs.
   - "open" : idée niche/créative où des choix prédéfinis limiteraient trop — question ouverte avec suggestions absentes ou très génériques.
4. Les suggestions doivent être concrètes, ancrées dans l'idée (pas génériques type "Autre"), avec hint court si utile.
5. Pose la question la plus discriminante — une seule — jamais une liste de sous-questions.
6. Si l'idée est déjà actionnable (clarityScore >= 75), ne pose pas de question.
7. Évite de répéter une dimension déjà clarifiée dans les tours précédents.
8. Ton sobre, expert, en français.`;

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
    temperature: 0.35,
  });

  const parsed = clarifyResponseSchema.parse(extractJsonObject(result.content));
  const questionType = resolveQuestionType(
    parsed.questionType,
    normalizeSuggestions(parsed.suggestions, parsed.questionType ?? "single"),
  );
  const suggestions = normalizeSuggestions(parsed.suggestions, questionType);
  const allowCustom = parsed.allowCustom ?? (questionType !== "single" || suggestions.length === 0);

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
    insight: parsed.insight?.trim() || undefined,
    dimension: parsed.targetDimension,
    question: parsed.question.trim(),
    questionType,
    suggestions,
    allowCustom,
  };
}

function buildFallbackSummary(initialIdea: string, turns: IdeaClarifyTurn[]): string {
  const extras = turns.map((t) => t.answer.trim()).filter(Boolean);
  if (extras.length === 0) return initialIdea.trim();
  return `${initialIdea.trim()} — ${extras.join(" ; ")}`;
}

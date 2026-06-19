import "server-only";

import { callOpenRouter, extractJsonObject } from "@/lib/sourcing/openrouter";
import { MODELS } from "@/lib/sourcing/constants";
import type { IdeaClarifyTurn, ProjectIdeaBrief } from "@/types/idea-brief";
import { ideaBriefSchema } from "@/lib/idea/schema";

export type GenerateBriefInput = {
  initialIdea: string;
  turns: IdeaClarifyTurn[];
  summary?: string;
};

function formatContext(input: GenerateBriefInput): string {
  const lines = [`Idée : "${input.initialIdea}"`];
  if (input.summary) lines.push(`Résumé validé : ${input.summary}`);
  for (const turn of input.turns) {
    lines.push(`- ${turn.question} → ${turn.answer}`);
  }
  return lines.join("\n");
}

export async function generateIdeaBrief(input: GenerateBriefInput): Promise<ProjectIdeaBrief> {
  const system = `Tu es un analyste SaaS expert du marché français.
Génère une fiche projet complète pour un fondateur solo qui veut lancer un micro-SaaS en France.
Réponds UNIQUEMENT en JSON valide.

Structure exacte :
{
  "identity": { "name", "pitch", "targetClient", "clientType": "b2b"|"b2c", "sector": healthcare|construction|hr|finance|legal|retail|education|hospitality },
  "problem": { "statement", "whyNowFrance" },
  "businessModel": { "pricing", "tiers": string[], "valueLogic" },
  "competition": { "competitors": [{ name, positioning, pricing, strength, weakness }], "positioningGap" },
  "marketFit": { "regulation", "cultureFit", "tam", "sam", "som", "analysis": string[] },
  "franceFitCriteria": { "problemExists": boolean, "regulation", "competitors", "cultureFit" },
  "whyItWorks": [{ "fact", "detail"? }] (3-5 items),
  "financials": [{ "name": "Prudent"|"Réaliste"|"Optimiste", clients, avgPrice, mrr, grossMargin }] (exactement 3),
  "acquisition": [{ "id", "title", "tactics": string[] }] (2-4 canaux FR concrets),
  "cacChannels": [{ channel, estimate, note }],
  "mvpPlan": { "features", "notYet", "stack", "roadmap": [{ day, tasks, objective? }] },
  "scores": { opportunity: 0-100, franceFit, buildability, margin, competitionGap: 0-10 }
}

Contraintes :
- Réaliste pour un solo founder, MVP en ~14 jours
- Stack par défaut : Next.js, Supabase, Stripe, Tailwind si pertinent
- Concurrence française crédible (noms plausibles)
- Chiffres MRR cohérents entre scénarios
- Tout en français sauf noms propres`;

  const user = formatContext(input);

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await callOpenRouter({
        model: MODELS.structure,
        system,
        user:
          attempt === 0
            ? user
            : `${user}\n\nRéponds avec un JSON strictement valide, sans markdown.`,
        responseFormat: { type: "json_object" },
        temperature: 0.35,
      });
      const parsed = ideaBriefSchema.parse(extractJsonObject(result.content));
      return {
        ...parsed,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Génération de la fiche échouée");
}

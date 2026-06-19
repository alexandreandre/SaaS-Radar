import { z } from "zod";
import type { Opportunity } from "@/types/opportunity";

export const productNameSuggestionsSchema = z.object({
  suggestions: z.array(z.string().min(2).max(40)).min(1).max(5),
});

export type ProductNameSuggestions = z.infer<typeof productNameSuggestionsSchema>;

export function buildProductNameSystemPrompt(): string {
  return `Tu proposes des noms de produit SaaS pour le marché français.

Règles strictes :
- 3 noms courts, mémorables, en français ou facilement prononçables en France
- Évoquent le pitch et le secteur sans être génériques
- NE PAS reprendre le nom du SaaS étranger d'inspiration
- NE PAS copier mot pour mot un nom existant connu
- Pas de tirets ni de suffixes "-ly" anglais sauf si très naturel
- Chaque nom : 1 à 3 mots max

Réponds UNIQUEMENT en JSON : { "suggestions": ["Nom1", "Nom2", "Nom3"] }`;
}

export function buildProductNameUserPrompt(opportunity: Opportunity): string {
  const inspiration = opportunity.foreignInspiration ?? opportunity.name;
  return `Pitch : ${opportunity.pitch}
Cible : ${opportunity.targetClient}
Secteur : ${opportunity.sector}
SaaS d'inspiration (NE PAS copier ce nom) : ${inspiration}

Propose 3 noms originaux pour la version française de ce produit.`;
}

export function buildIdeaProductNameUserPrompt(input: {
  initialIdea: string;
  summary?: string;
}): string {
  const lines = [`Idée : ${input.initialIdea}`];
  if (input.summary?.trim()) lines.push(`Résumé validé : ${input.summary.trim()}`);
  return `${lines.join("\n")}

Propose 3 noms originaux pour ce micro-SaaS sur le marché français.`;
}

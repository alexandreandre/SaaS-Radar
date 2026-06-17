import { z } from "zod";
import { MODELS } from "./constants";
import { callOpenRouter, extractJsonObject, type CostTracker } from "./openrouter";
import type { FactualLead } from "./schema";

const VERIFY_SYSTEM = [
  "Tu es un fact-checker. Tu vérifies des faits sur des micro-SaaS via recherche web.",
  "Réponds STRICTEMENT en JSON, sans prose.",
].join(" ");

export const factVerificationSchema = z.object({
  confirmed: z.boolean(),
  confidence: z.enum(["low", "medium", "high"]),
  tractionVerified: z.boolean(),
  tractionGaps: z.array(z.enum(["mrr", "authority", "community"])).optional(),
  countryConsistent: z.boolean().optional(),
  notes: z.string().optional(),
});

export type FactVerification = z.infer<typeof factVerificationSchema>;

function buildVerifyPrompt(lead: FactualLead): string {
  return [
    "Vérifie ces faits sur le micro-SaaS suivant. Confirme ou infirme la traction et l'existence du produit.",
    JSON.stringify(lead, null, 0),
    "",
    "Réponds avec un objet JSON :",
    JSON.stringify(
      {
        confirmed: true,
        confidence: "medium",
        tractionVerified: true,
        tractionGaps: ["mrr"],
        countryConsistent: true,
        notes: "Résumé court",
      },
      null,
      0
    ),
    "",
    "- confirmed : le produit existe et correspond au profil micro-SaaS décrit.",
    "- tractionVerified : les signaux de traction sont plausibles et sourçables.",
    "- tractionGaps : catégories absentes ou douteuses parmi mrr, authority, community.",
    "- countryConsistent : foreignInspiration et originCountry décrivent le même marché.",
    "- confidence : low si doute, medium si partiel, high si bien sourcé.",
  ].join("\n");
}

/** Étape D — vérification factuelle Sonar (1 appel léger par lead). */
export async function verifyLeadFacts(
  lead: FactualLead,
  tracker: CostTracker,
  model?: string
): Promise<FactVerification> {
  const { content, usage } = await callOpenRouter({
    model: model ?? MODELS.discovery,
    system: VERIFY_SYSTEM,
    user: buildVerifyPrompt(lead),
    temperature: 0.1,
  });
  tracker.add("Sonar-verify", usage);

  const raw = extractJsonObject(content);
  const parsed = factVerificationSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  return {
    confirmed: false,
    confidence: "low",
    tractionVerified: false,
    notes: "Échec validation fact-check",
  };
}

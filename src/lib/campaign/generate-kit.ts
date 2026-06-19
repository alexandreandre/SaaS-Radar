import "server-only";

import { z } from "zod";
import { callOpenRouter, extractJsonObject } from "@/lib/sourcing/openrouter";
import { MODELS } from "@/lib/sourcing/constants";

function coerceTextField(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item).trim()))
      .filter(Boolean)
      .join("\n");
  }
  if (value == null) return "";
  return String(value).trim();
}

const secondaryPromptSchema = z.object({
  label: z.string().min(1),
  content: z.string().min(1),
});

export const strategyBriefSchema = z.object({
  strategyBrief: z.preprocess(coerceTextField, z.string().min(200)),
});

export const campaignKitSchema = z.object({
  brief: z.preprocess(coerceTextField, z.string().min(80)),
  primaryPrompt: z.preprocess(coerceTextField, z.string().min(80)),
  secondaryPrompts: z.array(secondaryPromptSchema).optional(),
  distributionSteps: z.array(z.string().min(1)).optional(),
});

export type GeneratedStrategyBrief = z.infer<typeof strategyBriefSchema>;
export type GeneratedCampaignKit = z.infer<typeof campaignKitSchema>;

async function generateJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const retrySuffix =
        attempt > 0
          ? "\n\nRéponds UNIQUEMENT avec un objet JSON valide."
          : "";
      const result = await callOpenRouter({
        model: MODELS.structure,
        system,
        user: `${user}${retrySuffix}`,
        responseFormat: { type: "json_object" },
        temperature: 0.35,
      });
      const parsed = extractJsonObject(result.content);
      return schema.parse(parsed);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Génération campagne échouée");
}

export async function generateStrategyBriefJson(
  system: string,
  user: string,
): Promise<GeneratedStrategyBrief> {
  return generateJson(system, user, strategyBriefSchema);
}

export async function generateCampaignKitJson(
  system: string,
  user: string,
): Promise<GeneratedCampaignKit> {
  return generateJson(system, user, campaignKitSchema);
}

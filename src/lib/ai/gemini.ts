import "server-only";

import { z } from "zod";
import { callOpenRouter, extractJsonObject } from "@/lib/sourcing/openrouter";
import { MODELS } from "@/lib/sourcing/constants";

const buildPromptSchema = z.object({
  mvpPrompt: z.string().min(50),
  setupRecipe: z.string().min(30),
  quickStart: z.string().min(20),
});

export type GeneratedBuildPrompt = z.infer<typeof buildPromptSchema>;

export async function generateBuildPromptJson(
  system: string,
  user: string,
): Promise<GeneratedBuildPrompt> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await callOpenRouter({
        model: MODELS.structure,
        system,
        user: attempt > 0 ? `${user}\n\nRéponds UNIQUEMENT avec un objet JSON valide.` : user,
        responseFormat: { type: "json_object" },
        temperature: 0.3,
      });
      const parsed = extractJsonObject(result.content);
      return buildPromptSchema.parse(parsed);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Génération du prompt échouée");
}

export async function generateDeployRecipeMarkdown(
  system: string,
  user: string,
): Promise<string> {
  const result = await callOpenRouter({
    model: MODELS.structure,
    system,
    user,
    temperature: 0.2,
  });
  return result.content.trim();
}

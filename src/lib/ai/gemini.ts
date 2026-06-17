import "server-only";

import { z } from "zod";
import { callOpenRouter, extractJsonObject } from "@/lib/sourcing/openrouter";
import { MODELS } from "@/lib/sourcing/constants";
import type { BuildTool } from "@/lib/build/tools";
import type { InfraProfile } from "@/lib/build/infra-profile";
import type { BuildPromptLanguage } from "@/lib/build/prompt-language";
import {
  buildQualityRetryInstruction,
  validateBuildPrompt,
} from "@/lib/build/prompt-quality";

function coerceTextField(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "text" in item) {
          return String((item as { text: unknown }).text).trim();
        }
        return String(item).trim();
      })
      .filter(Boolean)
      .join("\n");
  }
  if (value == null) return "";
  return String(value).trim();
}

const buildPromptSchema = z.object({
  mvpPrompt: z.preprocess(coerceTextField, z.string().min(280)),
});

const productNameSuggestionsSchema = z.object({
  suggestions: z.array(z.string().min(2).max(40)).min(1).max(5),
});

export type GeneratedBuildPrompt = z.infer<typeof buildPromptSchema>;
export type GeneratedProductNameSuggestions = z.infer<typeof productNameSuggestionsSchema>;

export type GenerateBuildPromptOptions = {
  language: BuildPromptLanguage;
  infraProfile: InfraProfile;
  tool: BuildTool;
};

export type GeneratedBuildPromptResult = GeneratedBuildPrompt & {
  qualityWarnings?: string[];
};

export async function generateBuildPromptJson(
  system: string,
  user: string,
  options?: GenerateBuildPromptOptions,
): Promise<GeneratedBuildPromptResult> {
  let lastError: unknown;
  let qualityRetryNote: string | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const retrySuffix =
        attempt === 1
          ? "\n\nRéponds UNIQUEMENT avec un objet JSON valide. La clé mvpPrompt doit être une chaîne de texte, jamais un tableau."
          : "";
      const result = await callOpenRouter({
        model: MODELS.structure,
        system,
        user: `${user}${qualityRetryNote ?? ""}${retrySuffix}`,
        responseFormat: { type: "json_object" },
        temperature: 0.3,
      });
      const parsed = extractJsonObject(result.content);
      const generated = buildPromptSchema.parse(parsed);

      if (options) {
        const quality = validateBuildPrompt(
          generated.mvpPrompt,
          options.infraProfile,
          options.tool,
        );
        if (!quality.ok && attempt < 2) {
          qualityRetryNote = `\n\n${buildQualityRetryInstruction(quality.missing, options.language)}`;
          continue;
        }
        if (!quality.ok) {
          return { ...generated, qualityWarnings: quality.missing };
        }
      }

      return generated;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Génération du prompt échouée");
}

export async function generateProductNameSuggestions(
  system: string,
  user: string,
): Promise<GeneratedProductNameSuggestions> {
  const result = await callOpenRouter({
    model: MODELS.structure,
    system,
    user,
    responseFormat: { type: "json_object" },
    temperature: 0.7,
  });
  const parsed = extractJsonObject(result.content);
  return productNameSuggestionsSchema.parse(parsed);
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

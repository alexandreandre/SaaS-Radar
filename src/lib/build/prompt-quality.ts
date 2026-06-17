import type { BuildTool } from "@/lib/build/tools";
import type { InfraProfile } from "@/lib/build/infra-profile";

export type PromptQualityResult = {
  ok: boolean;
  missing: string[];
};

const AUTH_PATTERN =
  /\b(auth|authentification|authentication|inscription|signup|login|connexion|compte utilisateur)\b/i;
const BAAS_PATTERN = /\b(supabase|firebase|firestore|postgresql|postgres|row level security|rls)\b/i;
const ENV_PATTERN = /\.env\.example|environment variable|variables? d['']environnement/i;
const SECTION_PATTERN = /(?:^|\n)\s*(?:#{1,3}\s+|\d+[.)]\s+|\*\*[^*]+\*\*)/m;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countSections(text: string): number {
  const matches = text.match(/(?:^|\n)\s*(?:#{1,3}\s+|\d+[.)]\s+|\*\*[^*]+\*\*)/g);
  return matches?.length ?? 0;
}

export function validateBuildPrompt(
  mvpPrompt: string,
  infraProfile: InfraProfile,
  tool: BuildTool,
): PromptQualityResult {
  const missing: string[] = [];
  const needsInfraChecks =
    tool.level === "advanced" &&
    (infraProfile.services.includes("auth") || infraProfile.services.includes("database"));

  if (wordCount(mvpPrompt) < 400) {
    missing.push("longueur insuffisante (minimum ~400 mots)");
  }

  if (countSections(mvpPrompt) < 3 && !SECTION_PATTERN.test(mvpPrompt)) {
    missing.push("structure en sections (titres numérotés ou markdown)");
  }

  if (needsInfraChecks) {
    if (!AUTH_PATTERN.test(mvpPrompt)) {
      missing.push("mention explicite de l'authentification");
    }
    if (!BAAS_PATTERN.test(mvpPrompt)) {
      missing.push("mention de Supabase, Firebase ou backend de persistance");
    }
    if (!ENV_PATTERN.test(mvpPrompt)) {
      missing.push("section .env.example ou variables d'environnement");
    }

    if (infraProfile.primaryBackend === "supabase" && !/\bsupabase\b/i.test(mvpPrompt)) {
      missing.push("mention explicite de Supabase");
    }
  }

  return { ok: missing.length === 0, missing };
}

export function buildQualityRetryInstruction(missing: string[], language: "fr" | "en"): string {
  const items = missing.map((m) => `- ${m}`).join("\n");
  if (language === "en") {
    return `Your previous mvpPrompt was incomplete. Fix these issues in mvpPrompt:\n${items}\nRespond with valid JSON only.`;
  }
    return `Votre mvpPrompt précédent était incomplet. Corrigez ces points dans mvpPrompt :\n${items}\nRépondez uniquement en JSON valide.`;
}

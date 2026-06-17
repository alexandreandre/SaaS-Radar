export type BuildPromptLanguage = "fr" | "en";

export const DEFAULT_BUILD_PROMPT_LANGUAGE: BuildPromptLanguage = "fr";

export const BUILD_PROMPT_LANGUAGE_LABELS: Record<BuildPromptLanguage, string> = {
  fr: "français",
  en: "anglais",
};

export const BUILD_PROMPT_LANGUAGE_TOGGLE_LABEL = "Langue du prompt";

export function detectBrowserBuildPromptLanguage(): BuildPromptLanguage {
  if (typeof navigator === "undefined") return DEFAULT_BUILD_PROMPT_LANGUAGE;
  const lang = navigator.language?.toLowerCase() ?? "";
  return lang.startsWith("en") ? "en" : "fr";
}

export function resolveProjectBuildPromptLanguage(
  stored?: BuildPromptLanguage,
): BuildPromptLanguage {
  return stored ?? detectBrowserBuildPromptLanguage();
}

export function parseBuildPromptLanguage(raw: unknown): BuildPromptLanguage {
  return raw === "en" ? "en" : "fr";
}

export function resolveBuildPromptLanguage(
  projectLang?: BuildPromptLanguage,
  setupLang?: BuildPromptLanguage,
): BuildPromptLanguage {
  return setupLang ?? resolveProjectBuildPromptLanguage(projectLang);
}

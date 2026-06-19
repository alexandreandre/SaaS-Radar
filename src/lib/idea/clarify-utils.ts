import type { IdeaClarifyQuestionType, IdeaClarifySuggestion } from "@/types/idea-brief";

function slugify(value: string, index: number): string {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return slug || `opt-${index + 1}`;
}

export function normalizeSuggestions(
  raw: unknown,
  questionType: IdeaClarifyQuestionType,
): IdeaClarifySuggestion[] {
  if (!Array.isArray(raw)) return [];

  const suggestions: IdeaClarifySuggestion[] = [];

  for (let i = 0; i < raw.length && suggestions.length < 5; i++) {
    const item = raw[i];
    if (typeof item === "string" && item.trim()) {
      const label = item.trim().slice(0, 80);
      suggestions.push({ id: slugify(label, i), label });
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const label = typeof obj.label === "string" ? obj.label.trim() : "";
      if (!label) continue;
      const id =
        typeof obj.id === "string" && obj.id.trim()
          ? obj.id.trim().slice(0, 40)
          : slugify(label, i);
      const hint = typeof obj.hint === "string" ? obj.hint.trim().slice(0, 120) : undefined;
      suggestions.push({ id, label: label.slice(0, 80), hint: hint || undefined });
    }
  }

  if (questionType === "open") return [];
  if (questionType === "single") return suggestions.slice(0, 4);
  return suggestions.slice(0, 5);
}

export function resolveQuestionType(
  raw: string | undefined,
  suggestions: IdeaClarifySuggestion[],
): IdeaClarifyQuestionType {
  if (raw === "single" || raw === "multi" || raw === "open") return raw;
  if (suggestions.length === 0) return "open";
  return "single";
}

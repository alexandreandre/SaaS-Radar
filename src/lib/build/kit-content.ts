export type KitTextPart =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "code"; value: string };

/** Découpe setupRecipe (puces ou numéros) en lignes lisibles. */
export function parseKitLines(text: string | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, ""))
    .map(normalizeKitLine);
}

function normalizeKitLine(line: string): string {
  return line
    .replace(/['"]mvpPrompt['"]/gi, "le prompt")
    .replace(/\bmvpPrompt\b/g, "le prompt")
    .replace(/\ble le prompt\b/gi, "le prompt");
}

export type SetupStepKind =
  | "plan_mode"
  | "infra"
  | "paste_prompt"
  | "env"
  | "test"
  | "iterate"
  | "generic";

export type ParsedSetupStep = {
  kind: SetupStepKind;
  title: string;
  body?: string;
  recommended?: boolean;
  raw: string;
};

function classifySetupStep(text: string): SetupStepKind {
  const lower = text.toLowerCase();
  if (/mode plan|plan mode|shift\+tab/i.test(lower)) return "plan_mode";
  if (/supabase\.com|firebase|console\.firebase|créer un projet (supabase|firebase)/i.test(lower)) {
    return "infra";
  }
  if (/\.env\.example|\.env\.local|variables? d['']environnement|clés? (api|réelles|supabase|stripe)/i.test(lower)) {
    return "env";
  }
  if (/coller|paste|prompt|chat (de |d[''])?\w+|ouvrir (cursor|windsurf|bolt)/i.test(lower)) {
    return "paste_prompt";
  }
  if (/tester|testez|test local|vérifier|parcours principal|en local|npm run|preview/i.test(lower)) {
    return "test";
  }
  if (/itérer|itérer|ajustement|correction|nouveaux messages|affin/i.test(lower)) {
    return "iterate";
  }
  return "generic";
}

/** Parse une étape setupRecipe en titre, corps et catégorie visuelle. */
export function parseSetupStep(text: string): ParsedSetupStep {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^Étape\s+\d+\s*:\s*/i, "");
  cleaned = cleaned.replace(/^Step\s+\d+\s*:\s*/i, "");

  const recommended = /recommandé/i.test(cleaned);

  const boldMatch = cleaned.match(/^\*\*([^*]+)\*\*\s*:\s*(.+)$/);
  if (boldMatch) {
    const title = boldMatch[1].trim();
    const body = boldMatch[2].trim();
    return { kind: classifySetupStep(`${title} ${body}`), title, body, recommended, raw: text };
  }

  const colonMatch = cleaned.match(/^([^:]{4,80})\s*:\s*([\s\S]+)$/);
  if (colonMatch) {
    const title = colonMatch[1].trim();
    const body = colonMatch[2].trim();
    return { kind: classifySetupStep(cleaned), title, body, recommended, raw: text };
  }

  const kind = classifySetupStep(cleaned);
  return { kind, title: cleaned, recommended, raw: text };
}

export function parseSetupSteps(items: string[]): ParsedSetupStep[] {
  return items.map(parseSetupStep);
}

/** Parse le markdown inline léger (**gras**, `code`) pour l'affichage UI. */
export function parseKitInlineMarkdown(text: string): KitTextPart[] {
  const parts: KitTextPart[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push({ type: "bold", value: token.slice(2, -2) });
    } else {
      parts.push({ type: "code", value: token.slice(1, -1) });
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

/** Extrait un titre en gras suivi de « : » (format fréquent des recettes IA). */
export function parseKitStep(text: string): { title?: string; body: string } {
  const match = text.match(/^\*\*([^*]+)\*\*\s*:\s*(.+)$/);
  if (match) {
    return { title: match[1].trim(), body: match[2].trim() };
  }
  return { body: text };
}

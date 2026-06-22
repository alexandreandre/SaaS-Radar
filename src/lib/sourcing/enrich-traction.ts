import { MODELS } from "./constants";
import { callOpenRouter, extractJsonObject, type CostTracker } from "./openrouter";
import { tractionSignalSchema, type FactualLead } from "./schema";
import { resolveSignalKind } from "@/lib/traction-signals";
import {
  assessTractionQuality,
  type TractionCategory,
  type TractionQualityReport,
} from "./traction-quality";
import { normalizeLead } from "./assemble";

const ENRICH_SYSTEM = [
  "Tu es un analyste de traction micro-SaaS. Tu effectues une recherche web réelle.",
  "Tu complètes UNIQUEMENT les preuves manquantes, sans inventer de chiffres.",
  "Réponds STRICTEMENT par un objet JSON, sans prose.",
].join(" ");

const CATEGORY_LABELS: Record<TractionCategory, string> = {
  mrr: "MRR / revenu mensuel sourcé",
  authority: "autorité / SEO / recommandation professionnelle sourcée",
  community: "communauté / avis / mentions early-adopters sourcées",
};

type FactualTractionSignal = FactualLead["tractionSignals"][number];

function dedupeSignals(signals: FactualTractionSignal[]): FactualTractionSignal[] {
  const seen = new Set<string>();
  const out: FactualTractionSignal[] = [];
  for (const signal of signals) {
    const key = `${signal.label}|${signal.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
  }
  return out;
}

export function mergeTractionSignals(
  existing: FactualTractionSignal[],
  found: FactualTractionSignal[]
): FactualTractionSignal[] {
  const merged = dedupeSignals([...existing, ...found]);
  return merged.slice(0, 6).map((signal) => ({
    ...signal,
    kind: signal.kind ?? resolveSignalKind(signal),
  }));
}

function buildEnrichPrompt(lead: FactualLead, report: TractionQualityReport): string {
  const missingLines = report.missing.map((m) => `- ${CATEGORY_LABELS[m]}`).join("\n");
  const countryFix = report.countryMismatch
    ? `Réécris foreignInspiration avec le pays "${lead.originCountry}" entre parenthèses (pas un autre pays).`
    : "Garde foreignInspiration inchangé sauf correction de pays si nécessaire.";

  return [
    "Complète les preuves de traction manquantes pour ce micro-SaaS.",
    JSON.stringify(
      {
        name: lead.name,
        url: lead.url,
        pitch: lead.pitch,
        originCountry: lead.originCountry,
        foreignInspiration: lead.foreignInspiration,
        existingSignals: lead.tractionSignals,
        missingCategories: report.missing,
      },
      null,
      0
    ),
    "",
    "Catégories à trouver :",
    missingLines || "- Aucune catégorie manquante (ne cherche que si tu peux améliorer la qualité).",
    countryFix,
    "",
    "RÈGLES :",
    "- Ne rapporte QUE des faits sourçables avec sourceUrl réelle.",
    "- Ne invente PAS de MRR : si non public, utilise kind \"narrative\" et value explicite « MRR non public ».",
    "- Chaque nouveau signal : label, value, source, sourceUrl, kind (metric|narrative).",
    "- Ne duplique pas un signal existant (même label+value).",
    "",
    "Réponds avec un objet JSON :",
    JSON.stringify(
      {
        tractionSignals: [
          {
            label: "MRR estimé",
            value: "$18k",
            source: "GetLatka",
            sourceUrl: "https://getlatka.com/...",
            kind: "metric",
          },
        ],
        foreignInspiration: `${lead.name} (${lead.originCountry}) — ${lead.pitch}`,
      },
      null,
      0
    ),
  ].join("\n");
}

function parseEnrichResponse(raw: unknown): {
  tractionSignals: FactualTractionSignal[];
  foreignInspiration?: string;
} {
  if (!raw || typeof raw !== "object") {
    return { tractionSignals: [] };
  }
  const obj = raw as Record<string, unknown>;
  const signalsRaw = Array.isArray(obj.tractionSignals) ? obj.tractionSignals : [];
  const tractionSignals: FactualTractionSignal[] = [];

  for (const item of signalsRaw) {
    const parsed = tractionSignalSchema.safeParse(item);
    if (parsed.success) {
      tractionSignals.push({
        ...parsed.data,
        kind: parsed.data.kind ?? resolveSignalKind(parsed.data),
      });
    }
  }

  const foreignInspiration =
    typeof obj.foreignInspiration === "string" && obj.foreignInspiration.trim()
      ? obj.foreignInspiration.trim()
      : undefined;

  return { tractionSignals, foreignInspiration };
}

export type TractionEnrichmentResult = {
  lead: FactualLead;
  addedSignals: number;
  stillMissing: TractionCategory[];
  countryMismatch: boolean;
};

/** Pass Sonar ciblé — max 2 tentatives si JSON invalide. */
export async function enrichTractionSignals(
  lead: FactualLead,
  report: TractionQualityReport,
  tracker: CostTracker,
  model?: string
): Promise<TractionEnrichmentResult> {
  const beforeCount = lead.tractionSignals.length;
  let workingLead = { ...lead };
  let lastFeedback: string | undefined;

  for (let attempt = 1; attempt <= 1; attempt++) {
    const retrySuffix = lastFeedback
      ? `\n\nRETRY — réponse invalide : ${lastFeedback}\nRéponds uniquement avec le JSON demandé.`
      : "";

    const { content, usage } = await callOpenRouter({
      model: model ?? MODELS.verify,
      system: ENRICH_SYSTEM,
      user: buildEnrichPrompt(workingLead, report) + retrySuffix,
      temperature: 0.1,
    });
    tracker.add("Sonar-enrich", usage);

    let raw: unknown;
    try {
      raw = extractJsonObject(content);
    } catch (err) {
      lastFeedback = err instanceof Error ? err.message : String(err);
      continue;
    }

    const parsed = parseEnrichResponse(raw);
    if (parsed.tractionSignals.length === 0 && !parsed.foreignInspiration) {
      lastFeedback = "aucun signal ni foreignInspiration valide";
      continue;
    }

    workingLead = normalizeLead({
      ...workingLead,
      tractionSignals: mergeTractionSignals(workingLead.tractionSignals, parsed.tractionSignals),
      foreignInspiration: parsed.foreignInspiration ?? workingLead.foreignInspiration,
    });
    break;
  }

  const afterReport = assessTractionQuality(workingLead);

  return {
    lead: workingLead,
    addedSignals: Math.max(0, workingLead.tractionSignals.length - beforeCount),
    stillMissing: afterReport.missing,
    countryMismatch: afterReport.countryMismatch,
  };
}

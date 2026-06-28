import "server-only";

import { callOpenRouter, extractJsonObject } from "@/lib/sourcing/openrouter";
import type { Database } from "@/types/database";
import { sectorLabel, formatMrr } from "./template";

type OpportunityRow = Database["public"]["Tables"]["opportunities"]["Row"];

function parseScoresRaw(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { opportunity: 0, franceFit: 0 };
  const s = raw as Record<string, unknown>;
  return {
    opportunity: Math.round(Number(s.opportunity ?? 0)),
    franceFit: Number(s.franceFit ?? 0),
  };
}

function extractTextFromJson(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const obj = first as Record<string, unknown>;
      if (typeof obj.fact === "string") return obj.fact;
    }
  }
  return "";
}

export interface AICopy {
  subject: string;
  preheader: string;
  accrocheTitre: string;
  accrocheTexte: string;
}

/**
 * Génère via OpenRouter l'objet du mail, le préheader, le titre d'accroche
 * et le texte d'intro à partir des données de l'opportunité principale.
 * Utilise google/gemini-2.5-flash — rapide et peu coûteux.
 */
export async function generateNewsletterCopy(
  main: OpportunityRow,
  nbPublished: number,
  nbScannes: number,
  editionNo: number
): Promise<AICopy> {
  const scores = parseScoresRaw(main.scores);
  const whyText = extractTextFromJson(main.why_it_works);

  const prompt = `Tu es le rédacteur de "The Build Road", une newsletter hebdomadaire française qui présente des SaaS étrangers à répliquer en France.

Voici l'opportunité principale de cette semaine :
- Nom : ${main.name}
- Secteur : ${sectorLabel(main.sector ?? "")}
- Pays d'origine : ${main.origin_country}
- MRR étranger : ${formatMrr(main.revenue_min ?? 0, main.revenue_max ?? 0)}
- Score d'opportunité : ${scores.opportunity}/100
- Score France Fit : ${scores.franceFit}/10
- Pitch : ${main.pitch}
- Pourquoi ça marche : ${whyText || main.pitch}

Statistiques de cette édition #${editionNo} :
- ${nbScannes} SaaS scannés au total
- ${nbPublished} opportunités publiées

Génère exactement ce JSON (sans markdown, sans texte autour) :
{
  "subject": "Objet interrogatif — max 60 caractères — format : '[NomSaaS]: [MRR] à saisir en France ?' — commence par le nom exact du SaaS suivi d'un ':', inclut le MRR au format k$ ou M$, termine par une question avec '?', AUCUN emoji, seuls caractères spéciaux autorisés : ? $ , . : -",
  "preheader": "Texte préheader visible dans la boite mail — max 110 caractères, complète l'objet sans le répéter, donne un fait ou chiffre supplémentaire",
  "accrocheTitre": "Titre h1 de la newsletter — max 90 caractères, style journalistique, donne envie de lire, inclut le nom du SaaS ou un chiffre clé",
  "accrocheTexte": "Paragraphe d'intro — 2-3 phrases, ton direct et factuel, explique pourquoi cette opportunité est intéressante MAINTENANT pour un fondateur français"
}`;

  try {
    const result = await callOpenRouter({
      model: "google/gemini-2.5-flash",
      user: prompt,
      temperature: 0.7,
    });

    const json = extractJsonObject(result.content) as AICopy;
    return {
      subject: json.subject ?? `The Build Road #${editionNo} — ${main.name}`,
      preheader: json.preheader ?? `${nbPublished} SaaS validés cette semaine. Voici le meilleur.`,
      accrocheTitre: json.accrocheTitre ?? `${main.name} cartonne à l'étranger — la place est libre en France.`,
      accrocheTexte: json.accrocheTexte ?? main.pitch ?? "",
    };
  } catch (err) {
    console.error("[newsletter/ai-copy] Erreur génération IA, fallback statique :", err);
    return {
      subject: `The Build Road #${editionNo} — ${main.name}`,
      preheader: `${nbPublished} SaaS validés. ${main.name} cartonne à l'étranger — place encore libre en France.`,
      accrocheTitre: `${nbScannes} SaaS scannés. ${main.name} cartonne à l'étranger — la place est encore libre en France.`,
      accrocheTexte: main.pitch ?? "Le radar a identifié les meilleures opportunités de la semaine.",
    };
  }
}

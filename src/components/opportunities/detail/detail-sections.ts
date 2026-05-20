import type { Tier } from "@/lib/tier";
import type { Opportunity } from "@/types/opportunity";

export type DetailSection = {
  id: string;
  label: string;
  step: number;
  tier: Tier;
};

/** Parcours guidé — 7 étapes */
export const detailSections: DetailSection[] = [
  { id: "why", label: "1. L'idée en bref", step: 1, tier: "free" },
  { id: "market", label: "2. Le marché en France", step: 2, tier: "free" },
  { id: "revenus", label: "3. Combien vous pouvez gagner", step: 3, tier: "free" },
  { id: "foreign", label: "4. Le SaaS sur son marché d'origine", step: 4, tier: "builder" },
  { id: "prompt", label: "5. Prompt Claude Code", step: 5, tier: "pro" },
  { id: "clients", label: "6. Trouvez vos premiers clients", step: 6, tier: "builder" },
  { id: "guide", label: "7. Guide d'action complet", step: 7, tier: "pro" },
];

export const TOTAL_DETAIL_STEPS = detailSections.length;

const competitionLabels: Record<Opportunity["franceCompetition"], string> = {
  none: "Quasi aucune concurrence en France",
  low: "Marché peu concurrentiel en France",
  medium: "Concurrence modérée en France",
  high: "Marché compétitif en France",
};

export function getFranceCompetitionLabel(opportunity: Opportunity): string {
  return competitionLabels[opportunity.franceCompetition];
}

function foreignProductName(opportunity: Opportunity): string {
  const match = opportunity.foreignInspiration.match(/^([^(—]+)/);
  return match?.[1]?.trim() ?? opportunity.foreignInspiration;
}

/** Sources affichées sous chaque point « pourquoi ça marche » */
export function getWhyItWorksSources(opportunity: Opportunity): string[] {
  const product = foreignProductName(opportunity);
  return opportunity.whyItWorks.map((_, i) => {
    if (i === 0) return `Données marché · ${opportunity.originCountry}`;
    if (i === 1) {
      const src = opportunity.tractionSignals[0]?.source;
      return src ? `${src} · ${product}` : `Benchmark · ${product}`;
    }
    return opportunity.franceAnalysis[0]
      ? `Analyse France · SaaS Radar`
      : `Traction ${opportunity.originCountry} · SaaS Radar`;
  });
}

export function getTractionSignalDescription(
  opportunity: Opportunity,
  signal: Opportunity["tractionSignals"][0]
): string {
  const product = foreignProductName(opportunity);
  const label = signal.label.toLowerCase();
  if (label.includes("mrr") || label.includes("revenu")) {
    return `Ce que gagne déjà ${product} aux ${opportunity.originCountry === "États-Unis" ? "US" : opportunity.originCountry}`;
  }
  if (label.includes("backlink") || label.includes("seo")) {
    return `Autorité SEO du leader sur son marché d'origine`;
  }
  if (label.includes("reddit") || label.includes("mention")) {
    return `Intérêt early-adopters avant expansion internationale`;
  }
  if (label.includes("avis") || label.includes("app store")) {
    return `Adoption réelle par les utilisateurs cibles`;
  }
  return `Signal de traction vérifié · ${product}`;
}

export type LockedGuideTeaser = {
  id: string;
  step: number;
  label: string;
  teaser: string;
};

/** Aperçus floutés des étapes 2–7 derrière le paywall */
export function getLockedGuideTeasers(opportunity: Opportunity): LockedGuideTeaser[] {
  const acq = opportunity.acquisition[0];
  return [
    {
      id: "market",
      step: 2,
      label: "Le marché en France",
      teaser: opportunity.franceAnalysis[0] ?? "Analyse du marché local et des blockers réglementaires.",
    },
    {
      id: "revenus",
      step: 3,
      label: "Combien vous pouvez gagner",
      teaser: "Projections Prudent / Réaliste / Optimiste, CAC et ratio LTV/CAC détaillés.",
    },
    {
      id: "foreign",
      step: 4,
      label: "Le SaaS sur son marché d'origine",
      teaser:
        opportunity.foreignMarketProfile?.tagline ??
        `${opportunity.foreignInspiration} — modèle, pricing et signaux de traction à l'étranger.`,
    },
    {
      id: "prompt",
      step: 5,
      label: "Prompt Claude Code",
      teaser: opportunity.claudePrompt.split("\n").filter(Boolean)[0] ?? "Prompt prêt à coller dans Claude Code.",
    },
    {
      id: "clients",
      step: 6,
      label: "Trouvez vos premiers clients",
      teaser: acq ? `${acq.title} : ${acq.tactics[0]}` : "Canaux d'acquisition et scripts pour signer les premiers clients.",
    },
    {
      id: "guide",
      step: 7,
      label: "Guide d'action complet",
      teaser: opportunity.mvpPlan.features[0]
        ? `MVP : ${opportunity.mvpPlan.features[0]} — plan 4 semaines, emails et partenaires.`
        : "Plan MVP, roadmap 14 jours, emails et partenaires France.",
    },
  ];
}

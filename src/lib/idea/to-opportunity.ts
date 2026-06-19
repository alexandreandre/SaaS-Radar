import type { Opportunity } from "@/types/opportunity";
import type { ProjectIdeaBrief } from "@/types/idea-brief";

const IDEA_OPPORTUNITY_SLUG = "__idea__";

export function isIdeaProjectSlug(slug: string | undefined): boolean {
  return !slug || slug === IDEA_OPPORTUNITY_SLUG;
}

/** Convertit une fiche Idée en Opportunity synthétique pour réutiliser le cockpit existant. */
export function ideaBriefToOpportunity(brief: ProjectIdeaBrief, projectId: string): Opportunity {
  const now = brief.generatedAt || new Date().toISOString();
  const avgMrr =
    brief.financials.find((s) => s.name === "Réaliste")?.mrr ??
    brief.financials[1]?.mrr ??
    5000;

  return {
    id: `idea-${projectId}`,
    slug: IDEA_OPPORTUNITY_SLUG,
    name: brief.identity.name,
    pitch: brief.identity.pitch,
    originCountry: "France",
    originCountryCode: "FR",
    originFlag: "🇫🇷",
    sector: brief.identity.sector,
    targetClient: brief.identity.targetClient,
    clientType: brief.identity.clientType,
    techComplexity: brief.scores.buildability >= 7 ? "medium" : "low",
    franceCompetition:
      brief.scores.competitionGap >= 7
        ? "low"
        : brief.scores.competitionGap >= 5
          ? "medium"
          : "high",
    revenueMin: Math.round(avgMrr * 0.3),
    revenueMax: Math.round(avgMrr * 2),
    buildableUnder30Days: brief.scores.buildability >= 6,
    boringBusiness: true,
    aiPowered: brief.mvpPlan.stack.some((s) => /ia|ai|openai|llm/i.test(s)),
    lowCompetition: brief.scores.competitionGap >= 6,
    scores: brief.scores,
    franceFitCriteria: brief.franceFitCriteria,
    tractionSignals: [],
    whyItWorks: brief.whyItWorks,
    franceAnalysis: brief.marketFit.analysis,
    financialScenarios: brief.financials,
    cacChannels: brief.cacChannels,
    mvpPlan: brief.mvpPlan,
    claudePrompt: "",
    acquisition: brief.acquisition,
    entrepreneursBuilding: 0,
    foreignInspiration: brief.problem.whyNowFrance,
    frenchCompetitors: brief.competition.competitors,
    tamBreakdown: {
      tam: brief.marketFit.tam,
      sam: brief.marketFit.sam,
      som: brief.marketFit.som,
      note: brief.marketFit.cultureFit,
    },
    createdAt: now,
    publishedAt: now,
    sourceVerified: false,
  };
}

export function resolveCockpitOpportunity(
  project: { id: string; opportunitySlug?: string; ideaBrief?: ProjectIdeaBrief },
  catalogOpportunity: Opportunity | null | undefined,
): Opportunity | null {
  if (project.ideaBrief) {
    return ideaBriefToOpportunity(project.ideaBrief, project.id);
  }
  return catalogOpportunity ?? null;
}

import type { Opportunity } from "@/types/opportunity";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface OpportunitySectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

export function OpportunitySection({ opportunity, animationIndex }: OpportunitySectionProps) {
  const rows = [
    {
      label: "Client cible",
      value: opportunity.targetClient,
      type: "text" as const,
    },
    {
      label: "Type",
      value: opportunity.clientType.toUpperCase(),
      type: "badge" as const,
      color: "blue" as const,
    },
    {
      label: "Complexité technique",
      value:
        opportunity.techComplexity === "low"
          ? "Faible"
          : opportunity.techComplexity === "medium"
            ? "Moyenne"
            : "Élevée",
      type: "badge" as const,
      color:
        opportunity.techComplexity === "low"
          ? ("green" as const)
          : opportunity.techComplexity === "medium"
            ? ("yellow" as const)
            : ("red" as const),
    },
    {
      label: "Temps avant lancement",
      value: opportunity.buildableUnder30Days ? "< 30 jours" : "30-60 jours",
      type: "badge" as const,
      color: opportunity.buildableUnder30Days ? ("green" as const) : ("yellow" as const),
    },
    {
      label: "Concurrence en France",
      value:
        opportunity.franceCompetition === "none"
          ? "Aucune"
          : opportunity.franceCompetition === "low"
            ? "Faible"
            : opportunity.franceCompetition === "medium"
              ? "Moyenne"
              : "Élevée",
      type: "badge" as const,
      color:
        opportunity.franceCompetition === "none" || opportunity.franceCompetition === "low"
          ? ("green" as const)
          : opportunity.franceCompetition === "medium"
            ? ("yellow" as const)
            : ("red" as const),
    },
    {
      label: "Secteur",
      value: opportunity.sector,
      type: "text" as const,
    },
  ];

  return (
    <AnimatedSection id="opportunite" animationIndex={animationIndex} className="mb-12 scroll-mt-24">
      <SectionTitle number={1} title="L'opportunité" />

      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{opportunity.originFlag}</span>
            <div>
              <p className="font-semibold text-white">{opportunity.originCountry}</p>
              <p className="mt-0.5 text-xs capitalize text-gray-500">{opportunity.sector}</p>
            </div>
          </div>

          <a
            href={opportunity.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400 transition-colors hover:text-blue-300"
          >
            <span>Voir {opportunity.foreignInspiration?.split(" ")[0]}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="divide-y divide-gray-800/60">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-900/30"
            >
              <p className="text-sm text-gray-500">{row.label}</p>
              {row.type === "text" ? (
                <p className="text-sm font-medium capitalize text-white">{row.value}</p>
              ) : (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    row.color === "green" && "bg-green-500/15 text-green-400",
                    row.color === "yellow" && "bg-yellow-500/15 text-yellow-400",
                    row.color === "red" && "bg-red-500/15 text-red-400",
                    row.color === "blue" && "bg-blue-500/15 text-blue-400",
                  )}
                >
                  {row.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

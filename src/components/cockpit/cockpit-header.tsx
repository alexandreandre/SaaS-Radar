"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject, TargetScenario, ProjectPhase } from "@/lib/portfolio";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProjectPhaseBadge } from "@/components/cockpit/project-phase-badge";
import type { CockpitData } from "@/hooks/use-cockpit-data";

const SCENARIOS: TargetScenario[] = ["Prudent", "Réaliste", "Optimiste"];
const PHASES: { value: ProjectPhase; label: string }[] = [
  { value: "build", label: "Build" },
  { value: "launch", label: "Lancement" },
  { value: "revenue", label: "Revenu" },
  { value: "paused", label: "Pause" },
];

type CockpitHeaderProps = {
  project: UserProject;
  opportunity: Opportunity;
  data: CockpitData;
  onPhaseChange: (phase: ProjectPhase) => void;
  onScenarioChange: (scenario: TargetScenario) => void;
};

export function CockpitHeader({
  project,
  opportunity,
  data,
  onPhaseChange,
  onScenarioChange,
}: CockpitHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl">{opportunity.originFlag}</span>
            <ProjectPhaseBadge phase={project.phase} />
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">
            {opportunity.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{opportunity.pitch}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/opportunities/${opportunity.slug}`}>
            Voir la promesse Radar
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <span className="font-data text-[10px] uppercase tracking-data text-primary">
          Promesse Radar · {project.targetScenario}
        </span>
        <p className="mt-1">
          Objectif {formatCurrency(data.target)} — vous êtes à{" "}
          <strong>{data.metrics.promiseProgressPct} %</strong>
          {data.metrics.stackCoveragePct > 0 ? (
            <> · stack connecté à {data.metrics.stackCoveragePct} %</>
          ) : null}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PHASES.map((phase) => (
          <button
            key={phase.value}
            type="button"
            onClick={() => onPhaseChange(phase.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              project.phase === phase.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            )}
          >
            {phase.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario}
            type="button"
            onClick={() => onScenarioChange(scenario)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              project.targetScenario === scenario
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            )}
          >
            {scenario}
          </button>
        ))}
      </div>
    </>
  );
}

"use client";

import { ArrowRight, Megaphone, Users } from "lucide-react";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { formatCurrency } from "@/lib/utils";

type PlaybookClientsContextProps = {
  opportunity: Opportunity;
  project?: UserProject;
  data?: CockpitData;
  onModuleChange?: (module: CockpitModuleId) => void;
};

export function PlaybookClientsContextBanner({
  opportunity,
  project,
  onModuleChange,
}: PlaybookClientsContextProps) {
  const recommended = opportunity.acquisition[0];
  if (!recommended) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">Canal recommandé</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Megaphone className="h-3.5 w-3.5 text-primary" />
          {recommended.title}
        </span>
        <span className="text-muted-foreground">Cible : {opportunity.targetClient}</span>
        {project ? (
          <span className="text-muted-foreground">
            MRR actuel :{" "}
            <span className="font-data font-medium tabular-nums text-foreground">
              {formatCurrency(project.currentMrr)}
            </span>
          </span>
        ) : null}
      </div>
      {onModuleChange ? (
        <button
          type="button"
          onClick={() => onModuleChange("campagne")}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          Exécuter dans Campagne
          <ArrowRight className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

export function PlaybookClientsBridge({
  onModuleChange,
}: {
  onModuleChange?: (module: CockpitModuleId) => void;
}) {
  if (!onModuleChange) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        Premier client payant ?
      </div>
      <button
        type="button"
        onClick={() => onModuleChange("revenus")}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
      >
        Module Revenus
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

export function PlaybookStartHereBanner({ opportunity }: { opportunity: Opportunity }) {
  const recommended = opportunity.acquisition[0];
  if (!recommended) return null;

  const realisticPrice =
    opportunity.financialScenarios.find((s) => s.name === "Réaliste")?.avgPrice ?? 79;

  const firstActions = opportunity.acquisition.slice(0, 2).flatMap((tab) =>
    tab.tactics.slice(0, 1).map((tactic) => ({ tab, tactic })),
  );

  return (
    <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">Par où commencer</p>
      <p className="mt-1.5 text-sm">
        Canal recommandé :{" "}
        <span className="font-medium text-foreground">{recommended.title}</span>
        {" · "}
        <span className="text-muted-foreground">Cible : {opportunity.targetClient}</span>
        {" · "}
        <span className="text-muted-foreground">Prix : {realisticPrice}€/mois</span>
      </p>
      {firstActions.length > 0 ? (
        <ol className="mt-3 space-y-2">
          {firstActions.map(({ tab, tactic }, i) => (
            <li key={`${tab.id}-${i}`} className="flex gap-2 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-data text-[10px] font-semibold text-primary">
                {i + 1}
              </span>
              <span>
                <span className="font-medium text-foreground">{tab.title}</span>
                {" — "}
                {tactic}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

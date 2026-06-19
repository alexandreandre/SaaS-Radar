"use client";

import Link from "next/link";
import type { ProjectIdeaBrief } from "@/types/idea-brief";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { PlaybookCollapsibleBlock } from "@/components/cockpit/playbook/playbook-collapsible-block";
import { Button } from "@/components/ui/button";
import { sectorLabels } from "@/data/opportunities";

type IdeaBriefContentProps = {
  brief: ProjectIdeaBrief;
  project: UserProject;
  onModuleChange?: (module: CockpitModuleId) => void;
};

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
      <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function IdeaBriefContent({ brief, project, onModuleChange }: IdeaBriefContentProps) {
  const { identity, problem, businessModel, competition, marketFit, whyItWorks, financials, acquisition, mvpPlan, scores } =
    brief;

  const showGenerateCta = project.projectSource === "github" && !project.ideaBrief;

  return (
    <div className="space-y-4">
      {showGenerateCta ? (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-5 text-center">
          <p className="text-sm text-muted-foreground">
            Décrivez votre projet pour générer la fiche marché et business plan.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href={`/start?idea=${encodeURIComponent(project.ideaSeed ?? project.productName ?? "")}`}>
              Décrire mon projet
            </Link>
          </Button>
        </div>
      ) : null}

      <div>
        <p className="font-data text-[10px] uppercase tracking-data text-primary">Fiche projet</p>
        <h2 className="mt-1 font-display text-2xl font-medium tracking-tight">{identity.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{identity.pitch}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {identity.targetClient} · {identity.clientType.toUpperCase()} · {sectorLabels[identity.sector]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ScorePill label="Opportunité" value={scores.opportunity} />
        <ScorePill label="Fit France" value={Math.round(scores.franceFit * 10)} />
        <ScorePill label="Build" value={Math.round(scores.buildability * 10)} />
        <ScorePill label="Marge" value={Math.round(scores.margin * 10)} />
      </div>

      <PlaybookCollapsibleBlock title="Résumé" className="open:border-primary/20">
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong className="text-foreground">Problème :</strong> {problem.statement}
          </p>
          <p>
            <strong className="text-foreground">Pourquoi maintenant en France :</strong> {problem.whyNowFrance}
          </p>
          <p>
            <strong className="text-foreground">Modèle :</strong> {businessModel.pricing}
          </p>
          <p className="text-muted-foreground">{businessModel.valueLogic}</p>
          <ul className="list-inside list-disc text-muted-foreground">
            {businessModel.tiers.map((tier) => (
              <li key={tier}>{tier}</li>
            ))}
          </ul>
        </div>
      </PlaybookCollapsibleBlock>

      <PlaybookCollapsibleBlock title="Marché & concurrence">
        <div className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">TAM</p>
              <p className="font-medium">{marketFit.tam}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SAM</p>
              <p className="font-medium">{marketFit.sam}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SOM</p>
              <p className="font-medium">{marketFit.som}</p>
            </div>
          </div>
          <ul className="space-y-1 text-muted-foreground">
            {marketFit.analysis.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
          <p className="text-sm">
            <strong className="text-foreground">Positionnement :</strong> {competition.positioningGap}
          </p>
          <div className="space-y-3">
            {competition.competitors.map((c) => (
              <div key={c.name} className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="font-medium">{c.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.positioning} · {c.pricing}</p>
                <p className="mt-2 text-xs">
                  <span className="text-green-600 dark:text-green-400">+ {c.strength}</span>
                  {" · "}
                  <span className="text-amber-600 dark:text-amber-400">− {c.weakness}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </PlaybookCollapsibleBlock>

      <PlaybookCollapsibleBlock title="Pourquoi ça peut marcher">
        <ul className="space-y-3 text-sm">
          {whyItWorks.map((item) => (
            <li key={item.fact}>
              <p className="font-medium">{item.fact}</p>
              {item.detail ? <p className="mt-1 text-muted-foreground">{item.detail}</p> : null}
            </li>
          ))}
        </ul>
      </PlaybookCollapsibleBlock>

      <PlaybookCollapsibleBlock title="Finances">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4">Scénario</th>
                <th className="pb-2 pr-4">Clients</th>
                <th className="pb-2 pr-4">Panier</th>
                <th className="pb-2">MRR</th>
              </tr>
            </thead>
            <tbody>
              {financials.map((row) => (
                <tr key={row.name} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">{row.name}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.clients}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.avgPrice} €</td>
                  <td className="py-2 tabular-nums">{row.mrr.toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PlaybookCollapsibleBlock>

      <PlaybookCollapsibleBlock title="Acquisition">
        <div className="space-y-4">
          {acquisition.map((tab) => (
            <div key={tab.id}>
              <p className="text-sm font-medium">{tab.title}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {tab.tactics.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </PlaybookCollapsibleBlock>

      <PlaybookCollapsibleBlock title="MVP & roadmap">
        <div className="space-y-3 text-sm">
          <p className="font-medium">Features MVP</p>
          <ul className="list-inside list-disc text-muted-foreground">
            {mvpPlan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="font-medium">Stack</p>
          <p className="text-muted-foreground">{mvpPlan.stack.join(" · ")}</p>
          <div className="space-y-2">
            {mvpPlan.roadmap.map((step) => (
              <div key={step.day} className="rounded-lg border border-border/60 px-3 py-2">
                <p className="font-data text-[10px] uppercase tracking-data text-primary">{step.day}</p>
                <p className="mt-1">{step.objective ?? step.tasks[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </PlaybookCollapsibleBlock>

      {onModuleChange ? (
        <div className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onModuleChange("build")}>
            Passer au Build →
          </Button>
        </div>
      ) : null}
    </div>
  );
}

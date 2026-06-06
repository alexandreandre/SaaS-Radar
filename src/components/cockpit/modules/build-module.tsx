"use client";

import Link from "next/link";
import { LaunchJournalTracker } from "@/components/cockpit/launch-journal-tracker";
import { ProjectTimeline } from "@/components/cockpit/project-timeline";
import { ChartSection, StatCard } from "@/components/cockpit/ui/module-primitives";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function BuildModule({
  project,
  opportunity,
  onToggleMilestone,
}: CockpitModuleProps) {
  const githubStream = project.connectorStreams?.github;
  const sentryStream = project.connectorStreams?.sentry;
  const vercelStream = project.connectorStreams?.vercel;
  const fin = opportunity.financialScenarios.find((s) => s.name === project.targetScenario);
  const infraCost = opportunity.infraCosts?.reduce((s, c) => s + c.estimate, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {githubStream?.type === "dev" ? (
          <>
            <StatCard label="Deploys (30j)" value={String(githubStream.deploysLast30d)} />
            <StatCard label="Issues ouvertes" value={String(githubStream.openIssues)} />
            <StatCard label="Uptime" value={`${githubStream.uptimePct} %`} />
          </>
        ) : (
          <>
            <StatCard label="Deploys" value="—" />
            <StatCard label="Issues" value="—" />
            <StatCard label="Connectez GitHub" value="→" />
          </>
        )}
      </div>

      {(sentryStream?.type === "dev" || vercelStream?.type === "dev") && (
        <div className="grid gap-4 sm:grid-cols-2">
          {sentryStream?.type === "dev" ? (
            <section className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-semibold">Sentry</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Taux d&apos;erreur : {sentryStream.errorRate} % · {sentryStream.openIssues} issues
              </p>
              <Button className="mt-3" size="sm" variant="outline" disabled>
                Voir issues (bientôt)
              </Button>
            </section>
          ) : null}
          {vercelStream?.type === "dev" ? (
            <section className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-semibold">Vercel</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Uptime {vercelStream.uptimePct} % · {vercelStream.deploysLast30d} deploys
              </p>
              {infraCost > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Coût infra estimé Radar : {formatCurrency(infraCost)}/mois
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <LaunchJournalTracker
          opportunity={opportunity}
          project={project}
          onToggle={onToggleMilestone}
        />
      </section>

      <ChartSection title="Timeline">
        <ProjectTimeline project={project} />
      </ChartSection>

      {fin ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-semibold">Hypothèses simulateur</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard label="Clients cibles" value={String(fin.clients)} />
            <StatCard label="Prix moyen" value={formatCurrency(fin.avgPrice)} />
            <StatCard label="MRR cible" value={formatCurrency(fin.mrr)} />
          </div>
          <Button className="mt-4" variant="outline" size="sm" asChild>
            <Link href={`/simulator?from=${project.id}`}>Ouvrir le simulateur</Link>
          </Button>
        </section>
      ) : null}
    </div>
  );
}

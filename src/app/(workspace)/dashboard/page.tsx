"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { opportunities } from "@/data/opportunities";
import { getOpportunityBySlug } from "@/data/opportunities";
import { usePortfolio } from "@/contexts/portfolio-context";
import { getTargetMrr, isCheckInOverdue } from "@/lib/portfolio";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { CheckInBanner } from "@/components/portfolio/portfolio-stats";
import { NextActionCard } from "@/components/cockpit/next-action-card";

const watchlist = [
  { ...opportunities[1], delta: "Nouveau concurrent FR détecté", trend: "down" as const },
  { ...opportunities[3], delta: "Score Opportunity +3", trend: "up" as const },
  { ...opportunities[9], delta: "Stable", trend: "up" as const },
];

export default function DashboardPage() {
  const [signedIn] = useState(true);
  const { hydrated, activeProject, projects, stats, toggleMilestone } = usePortfolio();

  const building = activeProject;
  const opportunity = building ? getOpportunityBySlug(building.opportunitySlug) : null;
  const finTarget = building ? getTargetMrr(building) : 0;
  const launchMilestones = building?.milestones.filter((m) => m.source === "revenue").slice(0, 5) ?? [];

  if (!signedIn) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold">Connectez-vous</h1>
          <p className="mt-2 text-muted-foreground">Accédez à votre journal de lancement</p>
          <Button className="mt-6" onClick={() => {}}>
            Se connecter (mock)
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Bonjour, Alex 👋</p>
            <h1 className="font-display text-2xl font-medium tracking-tight">Votre tableau de bord</h1>
          </div>
          <div className="flex items-center gap-2">
            <BadgeMock>Plan Builder</BadgeMock>
            <Button variant="outline" size="sm" asChild>
              <Link href="/mes-saas">Mes SaaS →</Link>
            </Button>
          </div>
        </div>

        {hydrated && stats.overdueCheckIns > 0 ? (
          <div className="mt-8">
            <CheckInBanner overdueCount={stats.overdueCheckIns} />
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {building && opportunity ? (
              <>
                <section className="rounded-xl border border-border bg-card p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    En cours de build
                    {isCheckInOverdue(building) ? " · check-in en retard" : ""}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">{opportunity.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{opportunity.targetClient}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">MRR actuel</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(building.currentMrr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">MRR cible ({building.targetScenario})</p>
                      <p className="text-lg font-semibold">{formatCurrency(finTarget)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Score global</p>
                      <p className="text-lg font-semibold">{opportunity.scores.opportunity}/100</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/cockpit/${building.id}`}>Ouvrir le cockpit</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/opportunities/${building.opportunitySlug}`}>Voir le plan complet</Link>
                    </Button>
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-semibold">Journal de lancement</h2>
                  <div className="mt-4 space-y-3">
                    {launchMilestones.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted"
                      >
                        <Checkbox
                          checked={m.done}
                          onCheckedChange={() => toggleMilestone(building.id, m.id)}
                        />
                        <span className={m.done ? "text-muted-foreground line-through" : ""}>
                          {m.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-4" asChild>
                    <Link href={`/cockpit/${building.id}`}>Voir tout le journal</Link>
                  </Button>
                </section>
              </>
            ) : (
              <section className="rounded-xl border border-dashed border-primary/30 bg-accent/20 p-8 text-center">
                <h2 className="text-lg font-semibold">Aucun SaaS en build</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choisissez une opportunité et cliquez sur « Je build cette opportunité ».
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/opportunities">Explorer les opportunités</Link>
                </Button>
              </section>
            )}
          </div>

          <div className="space-y-6">
            {building && opportunity ? (
              <NextActionCard project={building} opportunity={opportunity} />
            ) : (
              <section className="rounded-xl border border-primary/30 bg-accent/40 p-6">
                <p className="text-xs font-medium text-primary">Prochaine action IA</p>
                <p className="mt-2 text-sm leading-relaxed">
                  Ajoutez votre premier SaaS pour recevoir des actions personnalisées chaque semaine.
                </p>
              </section>
            )}

            {projects.length > 0 ? (
              <section className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Mes SaaS</h2>
                  <Link href="/mes-saas" className="text-xs text-primary hover:underline">
                    Tout voir
                  </Link>
                </div>
                <ul className="mt-4 space-y-3">
                  {projects.slice(0, 3).map((p) => {
                    const opp = getOpportunityBySlug(p.opportunitySlug);
                    if (!opp) return null;
                    return (
                      <li key={p.id}>
                        <Link href={`/cockpit/${p.id}`} className="group block rounded-lg border border-border p-3 hover:bg-muted">
                          <p className="text-sm font-medium group-hover:text-primary">{opp.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatCurrency(p.currentMrr)} · {p.targetScenario}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold">Watchlist</h2>
              <ul className="mt-4 space-y-4">
                {watchlist.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/opportunities/${o.slug}`} className="group block">
                      <p className="text-sm font-medium group-hover:text-primary">{o.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {o.trend === "up" ? (
                          <TrendingUp className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-amber-600" />
                        )}
                        {o.delta}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function BadgeMock({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">{children}</span>
  );
}

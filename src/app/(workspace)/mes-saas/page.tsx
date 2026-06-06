"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { usePortfolio } from "@/contexts/portfolio-context";
import { CheckInBanner, PortfolioStatsBar } from "@/components/portfolio/portfolio-stats";
import { EmptyPortfolio } from "@/components/portfolio/empty-portfolio";
import { ProjectCard } from "@/components/portfolio/project-card";
import { cn } from "@/lib/utils";

type SortKey = "recent" | "mrr" | "progress";

export default function MesSaasPage() {
  const { hydrated, projects, stats, removeProject, setProjectPhase } = usePortfolio();
  const [sort, setSort] = useState<SortKey>("recent");

  const sorted = useMemo(() => {
    const list = [...projects];
    if (sort === "mrr") {
      return list.sort((a, b) => b.currentMrr - a.currentMrr);
    }
    if (sort === "progress") {
      return list.sort(
        (a, b) =>
          b.currentMrr / Math.max(1, b.mrrHistory.length) -
          a.currentMrr / Math.max(1, a.mrrHistory.length)
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [projects, sort]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-data text-[10px] uppercase tracking-data text-primary">
              Espace builder
            </p>
            <h1 className="font-display text-3xl font-medium tracking-tight">Mes SaaS développés</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Suivez votre progression réelle face à la promesse de chaque fiche Radar.
            </p>
          </div>
        </div>

        {!hydrated ? (
          <div className="mt-10 h-40 animate-pulse rounded-xl bg-muted" />
        ) : projects.length === 0 ? (
          <div className="mt-10">
            <EmptyPortfolio />
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <CheckInBanner overdueCount={stats.overdueCheckIns} />
            <PortfolioStatsBar stats={stats} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {projects.length} projet{projects.length > 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                {(
                  [
                    ["recent", "Plus récents"],
                    ["mrr", "MRR"],
                    ["progress", "Progression"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      sort === key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {sorted.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPause={(id) => setProjectPhase(id, "paused")}
                  onResume={(id) => setProjectPhase(id, "build")}
                  onRemove={removeProject}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

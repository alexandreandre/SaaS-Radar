"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { usePortfolio } from "@/contexts/portfolio-context";
import { useFavorites } from "@/contexts/favorites-context";
import { CheckInBanner, PortfolioStatsBar } from "@/components/portfolio/portfolio-stats";
import { EmptyPortfolio } from "@/components/portfolio/empty-portfolio";
import { cn } from "@/lib/utils";
import { MesSaasContentSkeleton } from "./mes-saas-content-skeleton";

const ProjectCard = dynamic(
  () => import("@/components/portfolio/project-card").then((m) => m.ProjectCard),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> },
);

type SortKey = "recent" | "mrr" | "progress";

export function MesSaasContent() {
  const {
    hydrated,
    projects,
    stats,
    opportunityCatalog,
    removeProject,
    setProjectPhase,
  } = usePortfolio();
  const { favoriteSlugs, hydrated: favoritesHydrated } = useFavorites();
  const [sort, setSort] = useState<SortKey>("recent");

  const favorites = useMemo(() => {
    const bySlug = new Map(opportunityCatalog.map((o) => [o.slug, o]));
    return favoriteSlugs
      .map((slug) => bySlug.get(slug))
      .filter((o): o is NonNullable<typeof o> => o != null);
  }, [opportunityCatalog, favoriteSlugs]);

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

  if (!hydrated) {
    return <MesSaasContentSkeleton />;
  }

  return (
    <div className="mt-8 space-y-8">
      {stats.overdueCheckIns > 0 ? (
        <CheckInBanner overdueCount={stats.overdueCheckIns} />
      ) : null}

      {projects.length === 0 ? (
        <EmptyPortfolio />
      ) : (
        <>
          <PortfolioStatsBar stats={stats} />

          <section id="projets" className="scroll-mt-24 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">{projects.length} SaaS en cours</h2>
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
          </section>
        </>
      )}

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Mes favoris</h2>
          {favorites.length > 0 && (
            <Link
              href="/opportunities?favorites=1"
              className="text-xs text-primary hover:underline"
            >
              Voir tout
            </Link>
          )}
        </div>
        {!favoritesHydrated ? (
          <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
        ) : favorites.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aucun favori pour le moment.{" "}
            <Link href="/opportunities" className="text-primary hover:underline">
              Parcourir le catalogue
            </Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {favorites.slice(0, 5).map((o) => (
              <li key={o.slug}>
                <Link href={`/opportunities/${o.slug}`} className="group block">
                  <p className="text-sm font-medium group-hover:text-primary">{o.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {o.originFlag} {o.originCountry} · Score{" "}
                    {Math.round(o.scores.opportunity)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

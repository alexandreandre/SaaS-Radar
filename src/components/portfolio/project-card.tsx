"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  MoreVertical,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { usePortfolio } from "@/contexts/portfolio-context";
import type { UserProject } from "@/lib/portfolio";
import {
  daysSince,
  isCheckInOverdue,
  resolveProductName,
} from "@/lib/portfolio";
import { getProjectCardMetrics, getProjectCardQuip } from "@/lib/portfolio-card-copy";
import { ProjectCardMetrics } from "@/components/portfolio/project-card-metrics";
import { getCockpitHref } from "@/lib/cockpit-modules";
import { getBuildJourneyState } from "@/lib/build/journey";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductLogoImage } from "@/components/cockpit/product-logo";
import { prefetchCockpitEntry } from "@/lib/cockpit-module-loader";

type ProjectCardProps = {
  project: UserProject;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
};

function formatOriginCountryCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  return normalized === "GB" ? "UK" : normalized;
}

export function ProjectCard({ project, onPause, onResume, onRemove }: ProjectCardProps) {
  const router = useRouter();
  const { catalogIndex } = usePortfolio();
  const catalogEntry = project.opportunitySlug
    ? catalogIndex.find((o) => o.slug === project.opportunitySlug)
    : undefined;

  const cockpitHref = getCockpitHref(project.id, "build");
  const prefetchCockpit = useCallback(() => {
    const entryModule: CockpitModuleId =
      getBuildJourneyState(project).displayPhase === "live" ? "campagne" : "build";
    router.prefetch(getCockpitHref(project.id, entryModule));
    prefetchCockpitEntry(project, entryModule);
  }, [project, router]);

  const openBuilder = useCallback(() => {
    router.push(cockpitHref);
  }, [cockpitHref, router]);

  if (!catalogEntry && !project.ideaBrief && project.projectSource !== "github" && !project.opportunitySlug) {
    return null;
  }

  const quip = getProjectCardQuip(project);
  const metrics = getProjectCardMetrics(project);
  const overdue = isCheckInOverdue(project);
  const paused = project.phase === "paused";
  const daysSinceCheckIn = daysSince(project.lastCheckInAt ?? project.createdAt);
  const displayName = resolveProductName(project);
  const originLabel = catalogEntry
    ? formatOriginCountryCode(catalogEntry.originCountryCode)
    : "FR";
  const subtitle = catalogEntry
    ? `Inspiré de ${catalogEntry.name}, ${originLabel}`
    : project.ideaBrief
      ? project.ideaBrief.identity.pitch.slice(0, 72)
      : project.opportunitySlug
        ? "Fiche catalogue archivée"
        : "Projet · GitHub";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      role="link"
      tabIndex={0}
      onClick={openBuilder}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openBuilder();
        }
      }}
      onMouseEnter={prefetchCockpit}
      onFocus={prefetchCockpit}
      className={cn(
        "flex h-full cursor-pointer flex-col rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:border-primary/30 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        paused && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <ProductLogoImage logo={project.productLogo} size="sm" alt={displayName} />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight">{displayName}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {catalogEntry ? (
                <DropdownMenuItem asChild>
                  <Link href={`/opportunities/${project.opportunitySlug}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir la fiche
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {catalogEntry ? <DropdownMenuSeparator /> : null}
              {paused ? (
                <DropdownMenuItem onClick={() => onResume(project.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Reprendre
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onPause(project.id)}>
                  <Pause className="mr-2 h-4 w-4" />
                  Mettre en pause
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onRemove(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Retirer du portfolio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p
        className={cn(
          "mt-6 text-xl font-medium leading-snug tracking-tight text-foreground sm:text-[1.35rem] sm:leading-snug",
          paused && "opacity-60",
        )}
      >
        {quip}
      </p>

      <ProjectCardMetrics metrics={metrics} muted={paused} />

      {overdue && !paused && daysSinceCheckIn !== null ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Check-in il y a {daysSinceCheckIn} jour{daysSinceCheckIn > 1 ? "s" : ""}
        </p>
      ) : null}

      <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-medium text-primary">
        Ouvrir le build
        <ArrowRight className="h-4 w-4" />
      </div>
    </motion.article>
  );
}

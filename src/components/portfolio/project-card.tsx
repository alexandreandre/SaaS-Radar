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
  getCurrentStepTitle,
  getMilestoneCounts,
  getProjectCardActionSummary,
  isCheckInOverdue,
  resolveProductName,
} from "@/lib/portfolio";
import { sectorLabels } from "@/data/opportunities";
import { getCockpitHref } from "@/lib/cockpit-modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PHASE_LABELS, ProjectPhaseBadge } from "@/components/cockpit/project-phase-badge";
import { ProductLogoImage } from "@/components/cockpit/product-logo";
import { prefetchCockpitEntry } from "@/lib/cockpit-module-loader";

type ProjectCardProps = {
  project: UserProject;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
};

export function ProjectCard({ project, onPause, onResume, onRemove }: ProjectCardProps) {
  const router = useRouter();
  const { getCatalogOpportunity } = usePortfolio();
  const opportunity = getCatalogOpportunity(project.opportunitySlug);

  const cockpitHref = getCockpitHref(project.id, "build");
  const prefetchCockpit = useCallback(() => {
    router.prefetch(cockpitHref);
    prefetchCockpitEntry(project, "build");
  }, [cockpitHref, project, router]);

  const openBuilder = useCallback(() => {
    router.push(cockpitHref);
  }, [cockpitHref, router]);

  if (!opportunity) return null;

  const { done: milestonesDone, total: milestonesTotal } = getMilestoneCounts(project);
  const stepTitle = getCurrentStepTitle(project);
  const nextAction = getProjectCardActionSummary(project, opportunity);
  const phaseLabel = PHASE_LABELS[project.phase];
  const overdue = isCheckInOverdue(project);
  const paused = project.phase === "paused";
  const daysSinceCheckIn = daysSince(project.lastCheckInAt ?? project.createdAt);
  const sectorLabel = sectorLabels[opportunity.sector] ?? opportunity.sector;

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
        paused && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <ProductLogoImage
            logo={project.productLogo}
            size="sm"
            alt={resolveProductName(project, opportunity)}
          />
          <h2 className="min-w-0 text-lg font-semibold leading-tight">
            {resolveProductName(project, opportunity)}
          </h2>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <ProjectPhaseBadge phase={project.phase} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/opportunities/${project.opportunitySlug}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Voir la fiche
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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

      <p className="mt-1 font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
        <span className="mr-1">{opportunity.originFlag}</span>
        {opportunity.originCountry}
        <span className="mx-1.5">·</span>
        {sectorLabel}
      </p>

      <div
        className={cn(
          "mt-5 rounded-lg border border-border/80 bg-muted/30 px-4 py-3",
          paused && "opacity-60"
        )}
      >
        <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
          Étape · {phaseLabel}
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug">{stepTitle}</p>
        {milestonesTotal > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {milestonesDone} / {milestonesTotal} étapes
          </p>
        ) : null}
      </div>

      {!paused ? (
        <div className="mt-4">
          <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
            Prochaine action
          </p>
          <p className="mt-1 line-clamp-3 text-sm leading-snug text-foreground/90">{nextAction}</p>
        </div>
      ) : null}

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

"use client";

import Link from "next/link";
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
} from "@/lib/portfolio";
import { sectorLabels } from "@/data/opportunities";
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

type ProjectCardProps = {
  project: UserProject;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
};

export function ProjectCard({ project, onPause, onResume, onRemove }: ProjectCardProps) {
  const { getCatalogOpportunity } = usePortfolio();
  const opportunity = getCatalogOpportunity(project.opportunitySlug);
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
      className={cn(
        "flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover",
        paused && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-lg font-semibold leading-tight">{opportunity.name}</h2>
        <div className="flex shrink-0 items-center gap-1.5">
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

      <div className="mt-auto pt-5">
        <Button size="sm" className="w-full gap-2 sm:w-auto" asChild>
          <Link href={`/cockpit/${project.id}`}>
            Continuer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}

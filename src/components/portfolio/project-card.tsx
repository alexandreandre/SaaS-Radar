"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, MoreVertical, Pause, Play, Trash2 } from "lucide-react";
import { usePortfolio } from "@/contexts/portfolio-context";
import type { UserProject } from "@/lib/portfolio";
import {
  getMilestoneProgress,
  getTargetMrr,
  isCheckInOverdue,
} from "@/lib/portfolio";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectPhaseBadge } from "@/components/cockpit/project-phase-badge";

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

  const target = getTargetMrr(project, opportunity);
  const progress = target > 0 ? Math.min(100, Math.round((project.currentMrr / target) * 100)) : 0;
  const milestoneProgress = getMilestoneProgress(project);
  const overdue = isCheckInOverdue(project);
  const paused = project.phase === "paused";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover",
        paused && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg">{opportunity.originFlag}</span>
            <ProjectPhaseBadge phase={project.phase} />
            {overdue && !paused ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                Check-in en retard
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-lg font-semibold leading-tight">{opportunity.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{opportunity.targetClient}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">MRR actuel</p>
          <p className="font-data text-lg font-semibold text-primary">
            {formatCurrency(project.currentMrr)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Objectif ({project.targetScenario})</p>
          <p className="font-data text-lg font-semibold">{formatCurrency(target)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Progression MRR</span>
          <span>{progress} %</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Journal de lancement</span>
          <span>{milestoneProgress} %</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-600/80 transition-all"
            style={{ width: `${milestoneProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href={`/cockpit/${project.id}`}>
            Piloter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/opportunities/${project.opportunitySlug}`}>
            Fiche source
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}

import { cn } from "@/lib/utils";
import type { ProjectPhase } from "@/lib/portfolio";

const LABELS: Record<ProjectPhase, string> = {
  build: "Build",
  launch: "Lancement",
  revenue: "Revenu",
  paused: "En pause",
};

const STYLES: Record<ProjectPhase, string> = {
  build: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  launch: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  revenue: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  paused: "bg-muted text-muted-foreground border-border",
};

export function ProjectPhaseBadge({ phase }: { phase: ProjectPhase }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        STYLES[phase]
      )}
    >
      {LABELS[phase]}
    </span>
  );
}

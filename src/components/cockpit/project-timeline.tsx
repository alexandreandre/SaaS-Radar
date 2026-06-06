import type { UserProject } from "@/lib/portfolio";
import { buildProjectTimeline } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const TYPE_STYLES = {
  created: "bg-primary/10 text-primary",
  "check-in": "bg-blue-500/10 text-blue-700",
  milestone: "bg-emerald-500/10 text-emerald-700",
  phase: "bg-violet-500/10 text-violet-700",
};

export function ProjectTimeline({ project }: { project: UserProject }) {
  const events = buildProjectTimeline(project);

  if (events.length <= 1) {
    return (
      <p className="text-sm text-muted-foreground">
        Votre timeline se remplira au fil des check-ins et jalons complétés.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            className={cn(
              "absolute -left-[1.6rem] top-1 flex h-3 w-3 rounded-full ring-4 ring-background",
              TYPE_STYLES[event.type].split(" ")[0]
            )}
          />
          <p className="text-xs text-muted-foreground">
            {new Date(event.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="mt-0.5 text-sm">{event.label}</p>
        </li>
      ))}
    </ol>
  );
}

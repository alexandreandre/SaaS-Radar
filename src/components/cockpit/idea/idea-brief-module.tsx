"use client";

import { IdeaBriefContent } from "@/components/cockpit/idea/idea-brief-content";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function IdeaBriefModule({
  project,
  onModuleChange,
}: CockpitModuleProps) {
  if (!project.ideaBrief) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Aucune fiche Idée disponible pour ce projet.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <IdeaBriefContent
        brief={project.ideaBrief}
        project={project}
        onModuleChange={onModuleChange}
      />
    </section>
  );
}

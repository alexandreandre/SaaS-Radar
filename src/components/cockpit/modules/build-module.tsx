"use client";

import { BuildConnectors } from "@/components/cockpit/build/build-connectors";
import { BuildHeroAction } from "@/components/cockpit/build/build-hero-action";
import { BuildProgressBar } from "@/components/cockpit/build/build-progress-bar";
import { BuildPromptKit } from "@/components/cockpit/build/build-prompt-kit";
import { BuildRoadmap } from "@/components/cockpit/build/build-roadmap";
import { BuildSafeguards } from "@/components/cockpit/build/build-safeguards";
import { BuildStack } from "@/components/cockpit/build/build-stack";
import { ProjectTimeline } from "@/components/cockpit/project-timeline";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function BuildModule({
  project,
  opportunity,
  onToggleMilestone,
  onModuleChange,
}: CockpitModuleProps) {
  return (
    <div className="space-y-6">
      <BuildHeroAction
        opportunity={opportunity}
        project={project}
        onToggleMilestone={onToggleMilestone}
      />

      <BuildProgressBar opportunity={opportunity} project={project} />

      <BuildRoadmap
        opportunity={opportunity}
        project={project}
        onToggle={onToggleMilestone}
      />

      <BuildStack opportunity={opportunity} />

      <BuildPromptKit opportunity={opportunity} builderStage={project.builderStage} />

      <BuildSafeguards opportunity={opportunity} />

      <BuildConnectors
        project={project}
        opportunity={opportunity}
        onModuleChange={onModuleChange}
      />

      <details className="rounded-xl border border-border bg-card shadow-card">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
          Historique du projet
        </summary>
        <div className="border-t border-border px-5 pb-5 pt-4">
          <ProjectTimeline project={project} />
        </div>
      </details>
    </div>
  );
}

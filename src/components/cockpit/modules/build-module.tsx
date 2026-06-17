"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { BuildConnectors } from "@/components/cockpit/build/build-connectors";
import { BuildControls } from "@/components/cockpit/build/build-controls";
import { BuildDeployGuide } from "@/components/cockpit/build/build-deploy-guide";
import { BuildGithubTracking } from "@/components/cockpit/build/build-github-tracking";
import { BuildHostTracking } from "@/components/cockpit/build/build-host-tracking";
import { BuildMvpScope } from "@/components/cockpit/build/build-mvp-scope";
import { BuildRecipeCard } from "@/components/cockpit/build/build-recipe-card";
import { BuildRevenueSection } from "@/components/cockpit/build/build-revenue-section";
import { BuildRoadmap } from "@/components/cockpit/build/build-roadmap";
import { BuildSafeguards } from "@/components/cockpit/build/build-safeguards";
import { BuildStack } from "@/components/cockpit/build/build-stack";
import { BuildToday } from "@/components/cockpit/build/build-today";
import { BuildToolPicker } from "@/components/cockpit/build/build-tool-picker";
import { CelebrationOverlay } from "@/components/cockpit/celebration-overlay";
import { ProjectTimeline } from "@/components/cockpit/project-timeline";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import { usePortfolio } from "@/contexts/portfolio-context";
import {
  getBuildStepCelebrationMessage,
  getCurrentBuildStepIndex,
  getRoadmapProgress,
  getStepIndexFromMilestoneId,
  shouldShowRevenueMilestonesOnBuild,
} from "@/lib/build-recipe";
import { getBuildTool, type BuildTool } from "@/lib/build/tools";

export function BuildModule({
  project,
  opportunity,
  onToggleMilestone,
  onModuleChange,
}: CockpitModuleProps) {
  const {
    toggleLaunchChecklistItem,
    setBuildSetupForProject,
    restoreBuildVersion,
    resetBuild,
  } = usePortfolio();
  const [celebration, setCelebration] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(!project.buildSetup);
  const [pendingTool, setPendingTool] = useState<BuildTool | null>(null);

  const currentStepIndex = getCurrentBuildStepIndex(project, opportunity);
  const progress = getRoadmapProgress(project, opportunity);
  const showRevenue = shouldShowRevenueMilestonesOnBuild(project, opportunity);

  const activeTool = useMemo(() => {
    const id = project.buildSetup?.toolId ?? pendingTool?.id;
    return id ? getBuildTool(id) : undefined;
  }, [project.buildSetup?.toolId, pendingTool?.id]);

  const handleToggleMilestone = useCallback(
    (milestoneId: string) => {
      const milestone = project.milestones.find((m) => m.id === milestoneId);
      const markingDone = milestone && !milestone.done;
      onToggleMilestone(milestoneId);

      if (markingDone && getStepIndexFromMilestoneId(milestoneId) !== null) {
        const message = getBuildStepCelebrationMessage(project, opportunity, milestoneId);
        if (message) setCelebration(message);
      }
    },
    [project, opportunity, onToggleMilestone],
  );

  const handleToolSelect = useCallback((tool: BuildTool) => {
    setPendingTool(tool);
    setPickerOpen(false);
  }, []);

  const handleGenerated = useCallback(
    (setup: Parameters<typeof setBuildSetupForProject>[1]) => {
      setBuildSetupForProject(project.id, setup);
      setPendingTool(null);
    },
    [project.id, setBuildSetupForProject],
  );

  const celebrationVariant =
    celebration?.includes("terminé") || celebration?.includes("checklist")
      ? "complete"
      : "milestone";

  const recipeTool = activeTool ?? pendingTool;

  return (
    <div className="space-y-4">
      <section aria-label="Aujourd'hui">
        <BuildToday
          opportunity={opportunity}
          project={project}
          onToggleMilestone={handleToggleMilestone}
        />
      </section>

      <section aria-label="Mon build" className="space-y-3">
        {pickerOpen || !project.buildSetup ? (
          <BuildToolPicker
            project={project}
            opportunity={opportunity}
            selectedToolId={recipeTool?.id}
            onSelect={handleToolSelect}
          />
        ) : null}

        {recipeTool ? (
          <>
            <BuildRecipeCard
              tool={recipeTool}
              opportunitySlug={opportunity.slug}
              setup={
                project.buildSetup?.toolId === recipeTool.id
                  ? project.buildSetup
                  : undefined
              }
              onGenerated={handleGenerated}
              onRegenerate={() => {}}
            />
            <BuildDeployGuide tool={recipeTool} opportunity={opportunity} />
            <BuildControls
              project={project}
              currentTool={activeTool}
              onChangeTool={() => setPickerOpen(true)}
              onRestoreVersion={(savedAt) => restoreBuildVersion(project.id, savedAt)}
              onReset={(opts) => {
                resetBuild(project.id, opts);
                setPickerOpen(true);
                setPendingTool(null);
              }}
            />
          </>
        ) : null}
      </section>

      <section aria-label="Suivi" className="space-y-3">
        <Suspense fallback={null}>
          <BuildGithubTracking project={project} onModuleChange={onModuleChange} />
        </Suspense>
        <Suspense fallback={null}>
          <BuildHostTracking project={project} onModuleChange={onModuleChange} />
        </Suspense>
      </section>

      <section aria-label="Plan" className="space-y-3">
        <BuildRoadmap
          opportunity={opportunity}
          project={project}
          onToggle={handleToggleMilestone}
        />
        <BuildMvpScope opportunity={opportunity} />
        {showRevenue ? (
          <BuildRevenueSection
            project={project}
            onToggle={handleToggleMilestone}
            onModuleChange={onModuleChange}
          />
        ) : null}
      </section>

      <section aria-label="Ressources" className="space-y-3">
        <details className="rounded-xl border border-border bg-card shadow-card">
          <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="font-medium text-muted-foreground">
              Détails techniques (avancé)
            </span>
          </summary>
          <div className="border-t border-border px-5 pb-5 pt-4">
            <BuildStack opportunity={opportunity} collapsed={false} />
          </div>
        </details>
        <BuildSafeguards
          opportunity={opportunity}
          project={project}
          onToggleLaunchChecklistItem={(index) =>
            toggleLaunchChecklistItem(project.id, index)
          }
          onModuleChange={onModuleChange}
        />
        <BuildConnectors
          project={project}
          opportunity={opportunity}
          onModuleChange={onModuleChange}
        />
      </section>

      <details className="rounded-xl border border-border bg-card shadow-card">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
          Historique du projet
          {progress.total > 0 ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              · {progress.done}/{progress.total} étapes
            </span>
          ) : null}
        </summary>
        <div className="border-t border-border px-5 pb-5 pt-4">
          <ProjectTimeline project={project} />
        </div>
      </details>

      <CelebrationOverlay
        show={celebration !== null}
        message={celebration ?? ""}
        variant={celebrationVariant}
        onDone={() => setCelebration(null)}
      />
    </div>
  );
}

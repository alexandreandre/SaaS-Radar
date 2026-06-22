"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BuildAppTracking } from "@/components/cockpit/build/build-app-tracking";
import { BuildDeployGuide } from "@/components/cockpit/build/build-deploy-guide";
import { BuildJourneyStepper } from "@/components/cockpit/build/build-journey-stepper";
import { BuildRecipeCard } from "@/components/cockpit/build/build-recipe-card";
import { BuildToolPicker } from "@/components/cockpit/build/build-tool-picker";
import { BuildToolPickerDialog } from "@/components/cockpit/build/build-tool-picker-dialog";
import { BuildToolSwitcher } from "@/components/cockpit/build/build-tool-switcher";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import { usePortfolioBuild } from "@/contexts/portfolio/use-portfolio";
import { getActiveBuildKit, getActiveBuildToolId, hasCustomProductName, resolveProductName } from "@/lib/portfolio";
import {
  detectBrowserBuildPromptLanguage,
  resolveProjectBuildPromptLanguage,
} from "@/lib/build/prompt-language";
import { getBuildTool, recommendLevel, type BuildTool, type BuildToolLevel } from "@/lib/build/tools";
import { getBuildJourneyState } from "@/lib/build/journey";
import { BuildProductNameCard } from "@/components/cockpit/build/build-product-name-card";

export function BuildModule({
  project,
  opportunity,
  onModuleChange,
}: CockpitModuleProps) {
  const {
    setBuildSetupForProject,
    setBuildDevLevel,
    setBuildPromptLanguage,
    switchBuildTool,
    restoreBuildVersion,
    resetBuild,
    setProductName,
  } = usePortfolioBuild(project.id);
  const [toolDialogOpen, setToolDialogOpen] = useState(false);

  const activeToolId = getActiveBuildToolId(project);
  const activeKit = getActiveBuildKit(project);
  const promptLanguage = resolveProjectBuildPromptLanguage(project.buildPromptLanguage);
  const hasStartedBuild = Boolean(activeToolId);

  useEffect(() => {
    if (!project.buildPromptLanguage) {
      setBuildPromptLanguage(project.id, detectBrowserBuildPromptLanguage());
    }
  }, [project.id, project.buildPromptLanguage, setBuildPromptLanguage]);

  const activeLevel = useMemo((): BuildToolLevel => {
    return (
      project.buildDevLevel ??
      (activeToolId ? getBuildTool(activeToolId)?.level : undefined) ??
      recommendLevel(project, opportunity)
    );
  }, [activeToolId, project, opportunity]);

  const recipeTool = useMemo(() => {
    return activeToolId ? getBuildTool(activeToolId) : undefined;
  }, [activeToolId]);

  const handleLevelSelect = useCallback(
    (level: BuildToolLevel) => {
      setBuildDevLevel(project.id, level);
    },
    [project.id, setBuildDevLevel],
  );

  const handleToolSelect = useCallback(
    (tool: BuildTool) => {
      setBuildDevLevel(project.id, tool.level);
      switchBuildTool(project.id, tool.id);
    },
    [project.id, setBuildDevLevel, switchBuildTool],
  );

  const handleGenerated = useCallback(
    (setup: Parameters<typeof setBuildSetupForProject>[1]) => {
      setBuildSetupForProject(project.id, setup);
    },
    [project.id, setBuildSetupForProject],
  );

  const journey = getBuildJourneyState(project);
  const deployGuideOpen = journey.currentStep === 3 && !project.hostConnection?.productionUrl;

  return (
    <div className="space-y-4">
      <section aria-label="Parcours">
        <BuildJourneyStepper project={project} onModuleChange={onModuleChange} />
      </section>

      {!hasCustomProductName(project) ? (
        <BuildProductNameCard
          opportunity={opportunity}
          value={project.productName ?? ""}
          onChange={(name) => setProductName(project.id, name)}
        />
      ) : null}

      <section aria-label="Mon build" className="space-y-3">
        {!hasStartedBuild ? (
          <BuildToolPicker
            project={project}
            opportunity={opportunity}
            selectedLevel={activeLevel}
            selectedToolId={activeToolId}
            onLevelSelect={handleLevelSelect}
            onSelect={handleToolSelect}
          />
        ) : (
          <>
            <BuildToolSwitcher
              project={project}
              onSwitch={(toolId) => switchBuildTool(project.id, toolId)}
              onAddTool={() => setToolDialogOpen(true)}
            />
            <BuildToolPickerDialog
              open={toolDialogOpen}
              onOpenChange={setToolDialogOpen}
              project={project}
              opportunity={opportunity}
              selectedLevel={activeLevel}
              onLevelSelect={handleLevelSelect}
              onSelect={handleToolSelect}
            />
          </>
        )}

        {recipeTool ? (
          <>
            <BuildRecipeCard
              tool={recipeTool}
              opportunity={opportunity}
              project={project}
              opportunitySlug={opportunity.slug}
              mvpFeatures={opportunity.mvpPlan.features}
              setup={activeKit}
              promptLanguage={promptLanguage}
              onPromptLanguageChange={(lang) => setBuildPromptLanguage(project.id, lang)}
              onGenerated={handleGenerated}
              onRegenerate={() => {}}
              onRestoreVersion={(savedAt) => restoreBuildVersion(project.id, savedAt)}
              onReset={(opts) => resetBuild(project.id, opts)}
            />
            {activeKit?.mvpPrompt ? (
              <BuildDeployGuide
                tool={recipeTool}
                productName={resolveProductName(project, opportunity)}
                defaultOpen={deployGuideOpen}
                expectedEnvVars={activeKit.expectedEnvVars}
              />
            ) : null}
          </>
        ) : null}
      </section>

      <section aria-label="Suivi">
        <BuildAppTracking
          project={project}
          tool={recipeTool}
          opportunity={opportunity}
          onModuleChange={onModuleChange}
        />
      </section>
    </div>
  );
}

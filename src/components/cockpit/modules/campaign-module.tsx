"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import { CampaignJourneyStepper } from "@/components/cockpit/campaign/campaign-journey-stepper";
import { CampaignStageBanner } from "@/components/cockpit/campaign/campaign-stage-banner";
import { CampaignGoalCard } from "@/components/cockpit/campaign/campaign-goal-card";
import { CampaignMessageCard } from "@/components/cockpit/campaign/campaign-message-card";
import { CampaignPrepareCard } from "@/components/cockpit/campaign/campaign-prepare-card";
import { CampaignActionBoard } from "@/components/cockpit/campaign/campaign-action-board";
import { CampaignTrackingPanel } from "@/components/cockpit/campaign/campaign-tracking-panel";
import { CampaignWeeklyCheckInForm } from "@/components/cockpit/campaign/campaign-weekly-checkin";
import { CampaignRetrospectiveCard } from "@/components/cockpit/campaign/campaign-retrospective";
import { CampaignAdvancedPanel } from "@/components/cockpit/campaign/campaign-advanced-panel";
import { ModuleCalloutsList } from "@/components/cockpit/module-callouts-list";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/contexts/portfolio-context";
import {
  getActiveCampaignKit,
  getActiveCampaignToolId,
  isStep1Complete,
} from "@/lib/campaign/kits";
import { getCampaignJourneyState } from "@/lib/campaign/journey";
import {
  ensureCampaignDefaults,
  needsCampaignDefaults,
} from "@/lib/campaign/bootstrap";
import {
  recommendProfileForProject,
  recommendStageForProject,
} from "@/lib/campaign/recommend";
import { suggestScaleStage } from "@/lib/campaign/infer-stage";
import { getStageDefinition } from "@/lib/campaign/stages";
import { getCampaignTool } from "@/lib/campaign/tools";
import { buildWorkflowForStack } from "@/lib/campaign/workflows";
import { buildModuleCallouts } from "@/lib/cockpit-callouts";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { ConnectorId } from "@/lib/connectors/types";
import { getCockpitHref } from "@/lib/cockpit-modules";
import { isCampaignToolId } from "@/lib/campaign/tools";

export function CampaignModule({
  project,
  opportunity,
  data,
  onModuleChange,
  onConnectIntegration,
}: CockpitModuleProps) {
  const {
    updateProject,
    setAcquisitionStage,
    setCampaignSmartGoal,
    setCampaignIcp,
    setCampaignPositioning,
    setStrategyBriefForProject,
    setCampaignChannel,
    setCampaignKitForProject,
    switchCampaignTool,
    addCampaignTool,
    removeCampaignTool,
    toggleCampaignAction,
    setCampaignTrackingPlan,
    addCampaignWeeklyCheckIn,
    completeCampaignRetrospective,
    startNewCampaignCycle,
    restoreCampaignVersion,
    resetCampaign,
  } = usePortfolio();

  const bootstrappedRef = useRef(false);

  const stage = recommendStageForProject(project, opportunity);
  const stageDef = getStageDefinition(stage);
  const profile = recommendProfileForProject(project, opportunity);
  const channel: ExtendedChannelKey =
    project.campaignSetup?.primaryChannel ?? "linkedin";
  const strategyBrief = project.campaignSetup?.strategyBrief;
  const activeToolId = getActiveCampaignToolId(project);
  const activeKit = getActiveCampaignKit(project);
  const activeTool = activeToolId ? getCampaignTool(activeToolId) : undefined;
  const actionItems = project.campaignSetup?.actionItems ?? [];

  const journey = getCampaignJourneyState(project, opportunity);
  const workflow = useMemo(
    () =>
      buildWorkflowForStack(
        channel,
        project.campaignSetup?.activeToolIds ?? (activeToolId ? [activeToolId] : []),
      ),
    [channel, project.campaignSetup?.activeToolIds, activeToolId],
  );

  const callouts = buildModuleCallouts("campagne", project, opportunity, {
    alerts: data.alerts,
  });

  useEffect(() => {
    if (bootstrappedRef.current || !needsCampaignDefaults(project)) return;
    bootstrappedRef.current = true;
    const { project: next } = ensureCampaignDefaults(project, opportunity);
    updateProject(project.id, {
      marketingProfile: next.marketingProfile,
      campaignSetup: next.campaignSetup,
    });
  }, [project, opportunity, updateProject]);

  const handleToolSelect = useCallback(
    (tool: CampaignTool) => {
      switchCampaignTool(project.id, tool.id);
      requestAnimationFrame(() => {
        document.getElementById("campaign-prepare")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    [project.id, switchCampaignTool],
  );

  const handleKitGenerated = useCallback(
    (kit: CampaignKit, generatedStrategyBrief?: string) => {
      setCampaignKitForProject(project.id, kit);
      if (generatedStrategyBrief?.trim()) {
        setStrategyBriefForProject(
          project.id,
          generatedStrategyBrief,
          channel,
          profile,
        );
      }
    },
    [project.id, channel, profile, setCampaignKitForProject, setStrategyBriefForProject],
  );

  const handleOpenTool = useCallback(
    (id: string, url?: string) => {
      if (isCampaignToolId(id) && url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      onConnectIntegration(id as ConnectorId);
    },
    [onConnectIntegration],
  );

  const step = journey.currentStep;
  const setup = project.campaignSetup;

  return (
    <div className="space-y-4">
      <CampaignJourneyStepper project={project} opportunity={opportunity} />

      {journey.appOnlineWarning ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {journey.appOnlineWarning}{" "}
          <Link
            href={getCockpitHref(project.id, "build")}
            className="font-medium underline"
          >
            Retour au Build
          </Link>
        </div>
      ) : null}

      <CampaignStageBanner
        stage={stage}
        primaryMetric={stageDef.primaryMetric}
        suggestScale={suggestScaleStage(project) && stage !== "scale"}
        onStageSelect={(s) => setAcquisitionStage(project.id, s, true)}
      />

      {(step === 1 || !isStep1Complete(setup)) && (
        <CampaignGoalCard
          opportunity={opportunity}
          stage={stage}
          channel={channel}
          smartGoal={setup?.smartGoal}
          icpSummary={setup?.icpSummary}
          collapsed={step > 1 && isStep1Complete(setup)}
          onChannelSelect={(c) => setCampaignChannel(project.id, c)}
          onSave={(goal, icp) => {
            setCampaignSmartGoal(project.id, goal);
            setCampaignIcp(project.id, icp);
          }}
        />
      )}

      {step >= 2 && isStep1Complete(setup) ? (
        <CampaignMessageCard
          project={project}
          opportunity={opportunity}
          stage={stage}
          channel={channel}
          profile={profile}
          positioning={setup?.positioning}
          strategyBrief={strategyBrief}
          collapsed={step > 2}
          onPositioningChange={(v) => setCampaignPositioning(project.id, v)}
          onBriefGenerated={(brief) =>
            setStrategyBriefForProject(project.id, brief, channel, profile)
          }
        />
      ) : null}

      {step >= 3 && (
        <div id="campaign-prepare">
          <CampaignPrepareCard
            project={project}
            opportunity={opportunity}
            stage={stage}
            channel={channel}
            profile={profile}
            activeTool={activeTool}
            activeKit={activeKit}
            strategyBrief={strategyBrief}
            trackingUtm={setup?.trackingPlan?.utmBase}
            onSelectTool={handleToolSelect}
            onKitGenerated={handleKitGenerated}
            onRestoreVersion={(savedAt) => restoreCampaignVersion(project.id, savedAt)}
            onReset={(opts) => resetCampaign(project.id, opts)}
            onConfigureTracking={() => {
              const utm =
                setup?.trackingPlan?.utmBase ??
                `${project.hostConnection?.productionUrl ?? "https://votre-site.fr"}?utm_source=campagne&utm_medium=${channel}`;
              setCampaignTrackingPlan(project.id, {
                utmBase: utm,
                requiredConnectors: setup?.trackingPlan?.requiredConnectors ?? ["plausible"],
                configuredAt: new Date().toISOString(),
              });
            }}
            onConnectIntegration={onConnectIntegration}
          />
        </div>
      )}

      {step >= 4 && actionItems.length > 0 ? (
        <CampaignActionBoard
          actions={actionItems}
          defaultOpen={step === 4}
          onToggle={(id) => toggleCampaignAction(project.id, id)}
          onOpenTool={handleOpenTool}
        />
      ) : null}

      {step >= 5 ? (
        <>
          <CampaignTrackingPanel
            project={project}
            stage={stage}
            smartGoal={setup?.smartGoal}
            weeklyCheckInCount={setup?.weeklyCheckIns?.length ?? 0}
            onModuleChange={onModuleChange}
            onConnectIntegration={(id) => onConnectIntegration(id as ConnectorId)}
          />
          <CampaignWeeklyCheckInForm
            checkIns={setup?.weeklyCheckIns ?? []}
            onSubmit={(checkIn) => addCampaignWeeklyCheckIn(project.id, checkIn)}
          />
          <CampaignRetrospectiveCard
            completed={setup?.cycleStatus === "completed"}
            onComplete={(data) => completeCampaignRetrospective(project.id, data)}
            onStartNewCycle={() => startNewCampaignCycle(project.id)}
          />
        </>
      ) : null}

      {journey.showAcquisitionHandoff ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={() => onModuleChange("acquisition")}>
            Ouvrir Acquisition (ROAS)
          </Button>
        </div>
      ) : null}

      {activeToolId ? (
        <CampaignAdvancedPanel
          project={project}
          opportunity={opportunity}
          profile={profile}
          channel={channel}
          workflow={workflow}
          onModuleChange={onModuleChange}
          onSwitchTool={(id) => switchCampaignTool(project.id, id)}
          onRemoveTool={(id) => removeCampaignTool(project.id, id)}
          onAddTool={(tool) => addCampaignTool(project.id, tool.id)}
        />
      ) : null}

      <ModuleCalloutsList callouts={callouts} onModuleChange={onModuleChange} />
    </div>
  );
}

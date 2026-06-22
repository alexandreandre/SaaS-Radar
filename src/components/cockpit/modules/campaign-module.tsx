"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import { CampaignWorkspace } from "@/components/cockpit/campaign/campaign-workspace";
import { ModuleCalloutsList } from "@/components/cockpit/module-callouts-list";
import { usePortfolio } from "@/contexts/portfolio-context";
import {
  getActiveCampaignKit,
  getActiveCampaignToolId,
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
import { getRecommendedStage } from "@/lib/campaign/stage-guidance";
import { getCampaignTool } from "@/lib/campaign/tools";
import { buildWorkflowForStack } from "@/lib/campaign/workflows";
import { buildModuleCallouts } from "@/lib/cockpit-callouts";
import { buildCampaignUtmUrl } from "@/lib/campaign/utm";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignSmartGoal } from "@/lib/campaign/stages";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { ConnectorId } from "@/lib/connectors/types";
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
    setCampaignTrackingPlan,
    addCampaignWeeklyCheckIn,
    completeCampaignRetrospective,
    startNewCampaignCycle,
    restoreCampaignVersion,
    resetCampaign,
    applyCampaignFullPlan,
    confirmCampaignSequenceStep,
    confirmDistributionGuideStep,
    setCampaignGtmMotion,
    setCampaignIcpStructured,
    setCampaignAttributionQuestion,
    toggleCampaignInfraGate,
    addMessageMarketFitNote,
    setMarketingProfile,
    confirmFoundationsRiverStop,
    startCampaignContentStudio,
    setCampaignContentAsset,
  } = usePortfolio();

  const bootstrappedRef = useRef(false);

  const stage = recommendStageForProject(project, opportunity);
  const profile =
    project.campaignSetup?.marketingProfile ??
    recommendProfileForProject(project, opportunity);
  const channel: ExtendedChannelKey =
    project.campaignSetup?.primaryChannel ?? "linkedin";
  const strategyBrief = project.campaignSetup?.strategyBrief;
  const activeToolId = getActiveCampaignToolId(project);
  const activeKit = getActiveCampaignKit(project);
  const activeTool = activeToolId ? getCampaignTool(activeToolId) : undefined;

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

  const handleConfigureTracking = useCallback(() => {
    const setup = project.campaignSetup;
    const utm = buildCampaignUtmUrl(
      project.hostConnection?.productionUrl ?? "https://votre-site.fr",
      channel,
      setup?.activeSequenceId,
    );
    setCampaignTrackingPlan(project.id, {
      utmBase: utm,
      requiredConnectors: setup?.trackingPlan?.requiredConnectors ?? ["plausible"],
      configuredAt: new Date().toISOString(),
    });
  }, [project, channel, setCampaignTrackingPlan]);

  const handleStartContentStudio = useCallback(() => {
    startCampaignContentStudio(project.id, opportunity);
  }, [project.id, opportunity, startCampaignContentStudio]);

  const handleConfirmContentAsset = useCallback(
    (assetId: string, fields: Record<string, string>) => {
      setCampaignContentAsset(project.id, assetId, fields, opportunity);
    },
    [project.id, opportunity, setCampaignContentAsset],
  );

  const handleConfirmRiverStop = useCallback(
    (payload: import("@/lib/portfolio").ConfirmFoundationsRiverPayload) => {
      confirmFoundationsRiverStop(project.id, payload, opportunity);
    },
    [project.id, opportunity, confirmFoundationsRiverStop],
  );

  return (
    <div className="space-y-4">
      <CampaignWorkspace
        project={project}
        opportunity={opportunity}
        stage={stage}
        channel={channel}
        profile={profile}
        activeTool={activeTool}
        activeKit={activeKit}
        strategyBrief={strategyBrief}
        workflow={workflow}
        suggestScale={suggestScaleStage(project) && stage !== "scale"}
        showAcquisitionHandoff={journey.showAcquisitionHandoff}
        metricsData={data}
        onStageSelect={(s) => setAcquisitionStage(project.id, s, true)}
        onResetStageToRecommended={() => {
          const recommended = getRecommendedStage(project, channel);
          setAcquisitionStage(project.id, recommended, false);
        }}
        onChannelSelect={(c) => setCampaignChannel(project.id, c)}
        onSaveGoal={(goal: CampaignSmartGoal, icp: string) => {
          setCampaignSmartGoal(project.id, goal);
          setCampaignIcp(project.id, icp);
        }}
        onApplyFullPlan={(plan) => applyCampaignFullPlan(project.id, plan)}
        onPositioningChange={(v) => setCampaignPositioning(project.id, v)}
        onBriefGenerated={(brief) =>
          setStrategyBriefForProject(project.id, brief, channel, profile)
        }
        onSelectTool={handleToolSelect}
        onKitGenerated={handleKitGenerated}
        onRestoreVersion={(savedAt) => restoreCampaignVersion(project.id, savedAt)}
        onReset={(opts) => resetCampaign(project.id, opts)}
        onConfigureTracking={handleConfigureTracking}
        onConnectIntegration={onConnectIntegration}
        onConfirmSequenceStep={(stepId) => confirmCampaignSequenceStep(project.id, stepId)}
        onConfirmDistributionStep={(stepIndex) =>
          confirmDistributionGuideStep(project.id, stepIndex)
        }
        onOpenTool={handleOpenTool}
        onModuleChange={onModuleChange}
        onWeeklyCheckIn={(checkIn) => addCampaignWeeklyCheckIn(project.id, checkIn)}
        onCompleteRetrospective={(retro) => completeCampaignRetrospective(project.id, retro)}
        onStartNewCycle={() => startNewCampaignCycle(project.id)}
        onMotionChange={(m) => setCampaignGtmMotion(project.id, m)}
        onProfileChange={(p) => setMarketingProfile(project.id, p)}
        onIcpStructuredSave={(icp, summary) =>
          setCampaignIcpStructured(project.id, icp, summary)
        }
        onAttributionChange={(enabled) =>
          setCampaignAttributionQuestion(project.id, enabled)
        }
        onConfirmRiverStop={handleConfirmRiverStop}
        onConfirmInfraGate={(gateId) => toggleCampaignInfraGate(project.id, gateId)}
        onStartContentStudio={handleStartContentStudio}
        onConfirmContentAsset={handleConfirmContentAsset}
        onAddMarketFitNote={(note) => addMessageMarketFitNote(project.id, note)}
      />

      <ModuleCalloutsList callouts={callouts} onModuleChange={onModuleChange} />
    </div>
  );
}

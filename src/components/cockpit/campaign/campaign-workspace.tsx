"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignWeeklyCheckIn } from "@/lib/campaign/kits";
import type { CampaignSmartGoal } from "@/lib/campaign/stages";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { CampaignWorkflowNode } from "@/lib/campaign/workflows";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import type { CampaignIcpStructured } from "@/lib/campaign/kits";
import type { InfraGateId } from "@/lib/campaign/infra-gates";
import type { CampaignPhaseId } from "@/lib/campaign/phases";
import { resolveCampaignPhase } from "@/lib/campaign/phases";
import { getBuildJourneyState } from "@/lib/build/journey";
import { CampaignHeader } from "@/components/cockpit/campaign/campaign-header";
import { CampaignPhaseStepper } from "@/components/cockpit/campaign/campaign-phase-stepper";
import { CampaignFoundationsScreen } from "@/components/cockpit/campaign/campaign-foundations-screen";
import { CampaignCreationScreen } from "@/components/cockpit/campaign/campaign-creation-screen";
import { CampaignDiffusionScreen } from "@/components/cockpit/campaign/campaign-diffusion-screen";
import { CampaignMeasureScreen } from "@/components/cockpit/campaign/campaign-measure-screen";
import { getCockpitHref } from "@/lib/cockpit-modules";
import type { ConnectorId } from "@/lib/connectors/types";
import type { CampaignToolId } from "@/lib/campaign/tools";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import type { CampaignActionItem } from "@/lib/campaign/stages";

type CampaignWorkspaceProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  activeTool?: CampaignTool;
  activeKit?: CampaignKit;
  strategyBrief?: string;
  workflow: CampaignWorkflowNode[];
  suggestScale: boolean;
  showAcquisitionHandoff: boolean;
  onStageSelect: (stage: AcquisitionStage) => void;
  onResetStageToRecommended?: () => void;
  onChannelSelect: (channel: ExtendedChannelKey) => void;
  onSaveGoal: (goal: CampaignSmartGoal, icp: string) => void;
  onPositioningChange: (value: string) => void;
  onBriefGenerated: (brief: string) => void;
  onSelectTool: (tool: CampaignTool) => void;
  onKitGenerated: (kit: CampaignKit, strategyBrief?: string) => void;
  onRestoreVersion: (savedAt: string) => void;
  onReset: (opts?: { keepStrategy?: boolean }) => void;
  onConfigureTracking: () => void;
  onConnectIntegration: (id: ConnectorId) => void;
  onToggleSequenceStep: (stepId: string) => void;
  onOpenTool: (id: string, url?: string) => void;
  onModuleChange: (module: CockpitModuleId) => void;
  onWeeklyCheckIn: (checkIn: CampaignWeeklyCheckIn) => void;
  onCompleteRetrospective: (data: {
    worked: string;
    blocked: string;
    nextChange: string;
  }) => void;
  onStartNewCycle: () => void;
  onApplyFullPlan?: (data: {
    smartGoal: CampaignSmartGoal;
    icpSummary: string;
    positioning: string;
    strategyBrief: string;
    actionItems?: CampaignActionItem[];
    activeSequenceId?: string;
  }) => void;
  onMotionChange: (motion: GtmMotion) => void;
  onProfileChange: (profile: MarketingProfile) => void;
  onIcpStructuredSave: (icp: CampaignIcpStructured, summary: string) => void;
  onAttributionChange: (enabled: boolean) => void;
  onToggleInfraGate: (gateId: InfraGateId) => void;
  onToggleAsset: (index: number) => void;
  onAcknowledgeDistribution?: () => void;
  onAddMarketFitNote: (note: string) => void;
  metricsData?: CockpitData;
};

export function CampaignWorkspace(props: CampaignWorkspaceProps) {
  const {
    project,
    opportunity,
    stage,
    channel,
    profile,
    activeTool,
    activeKit,
    strategyBrief,
    workflow,
    suggestScale,
    showAcquisitionHandoff,
    metricsData,
    onStageSelect,
    onResetStageToRecommended,
    onChannelSelect,
    onSaveGoal,
    onApplyFullPlan,
    onPositioningChange,
    onBriefGenerated,
    onSelectTool,
    onKitGenerated,
    onRestoreVersion,
    onReset,
    onConfigureTracking,
    onConnectIntegration,
    onToggleSequenceStep,
    onOpenTool,
    onModuleChange,
    onWeeklyCheckIn,
    onCompleteRetrospective,
    onStartNewCycle,
    onMotionChange,
    onProfileChange,
    onIcpStructuredSave,
    onAttributionChange,
    onToggleInfraGate,
    onToggleAsset,
    onAcknowledgeDistribution,
    onAddMarketFitNote,
  } = props;

  const suggestedPhase = resolveCampaignPhase(project, stage);
  const [activePhase, setActivePhase] = useState<CampaignPhaseId>(suggestedPhase);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (id.includes("foundations")) setActivePhase("foundations");
    if (id.includes("creation")) setActivePhase("creation");
    if (id.includes("infra")) setActivePhase("creation");
  }, []);

  const buildState = getBuildJourneyState(project);

  return (
    <div className="space-y-4">
      {buildState.displayPhase !== "live" ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Votre app n&apos;est pas encore en ligne — vous pouvez préparer, lancez après le déploiement.{" "}
          <Link href={getCockpitHref(project.id, "build")} className="font-medium underline">
            Build
          </Link>
        </div>
      ) : null}

      <CampaignHeader
        project={project}
        opportunity={opportunity}
        stage={stage}
        channel={channel}
        onBlockerClick={scrollTo}
      />

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <CampaignPhaseStepper
          project={project}
          stage={stage}
          activePhase={activePhase}
          onPhaseSelect={setActivePhase}
        />

        <div className="mt-4">
          {activePhase === "foundations" ? (
            <CampaignFoundationsScreen
              project={project}
              opportunity={opportunity}
              stage={stage}
              channel={channel}
              profile={profile}
              strategyBrief={strategyBrief}
              suggestScale={suggestScale}
              onStageSelect={onStageSelect}
              onResetStageToRecommended={onResetStageToRecommended}
              onChannelSelect={onChannelSelect}
              onSaveGoal={onSaveGoal}
              onApplyFullPlan={onApplyFullPlan}
              onPositioningChange={onPositioningChange}
              onBriefGenerated={onBriefGenerated}
              onMotionChange={onMotionChange}
              onProfileChange={onProfileChange}
              onIcpStructuredSave={onIcpStructuredSave}
              onAttributionChange={onAttributionChange}
              onContinue={() => setActivePhase("creation")}
            />
          ) : null}

          {activePhase === "creation" ? (
            <CampaignCreationScreen
              project={project}
              opportunity={opportunity}
              stage={stage}
              channel={channel}
              profile={profile}
              strategyBrief={strategyBrief}
              activeTool={activeTool}
              activeKit={activeKit}
              workflow={workflow}
              onSelectTool={onSelectTool}
              onKitGenerated={onKitGenerated}
              onRestoreVersion={onRestoreVersion}
              onReset={onReset}
              onToggleAsset={onToggleAsset}
              onToggleInfraGate={onToggleInfraGate}
              onContinue={() => setActivePhase("diffusion")}
            />
          ) : null}

          {activePhase === "diffusion" ? (
            <CampaignDiffusionScreen
              project={project}
              opportunity={opportunity}
              stage={stage}
              channel={channel}
              onToggleSequenceStep={onToggleSequenceStep}
              onOpenTool={onOpenTool}
              onConnectIntegration={onConnectIntegration}
              onConfigureTracking={onConfigureTracking}
              onAcknowledgeDistribution={onAcknowledgeDistribution ?? (() => {})}
              onContinue={() => setActivePhase("measure")}
            />
          ) : null}

          {activePhase === "measure" ? (
            <CampaignMeasureScreen
              project={project}
              opportunity={opportunity}
              stage={stage}
              channel={channel}
              metricsData={metricsData}
              showAcquisitionHandoff={showAcquisitionHandoff}
              onConnectIntegration={onConnectIntegration}
              onWeeklyCheckIn={onWeeklyCheckIn}
              onCompleteRetrospective={onCompleteRetrospective}
              onStartNewCycle={onStartNewCycle}
              onModuleChange={onModuleChange}
              onAddMarketFitNote={onAddMarketFitNote}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

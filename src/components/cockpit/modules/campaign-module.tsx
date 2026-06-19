"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import { CampaignJourneyStepper } from "@/components/cockpit/campaign/campaign-journey-stepper";
import { CampaignProfilePicker } from "@/components/cockpit/campaign/campaign-profile-picker";
import { CampaignChannelCard } from "@/components/cockpit/campaign/campaign-channel-card";
import {
  CampaignToolPicker,
  CampaignToolPickerDialog,
} from "@/components/cockpit/campaign/campaign-tool-picker";
import { CampaignToolSwitcher } from "@/components/cockpit/campaign/campaign-tool-switcher";
import { CampaignStrategyCard } from "@/components/cockpit/campaign/campaign-strategy-card";
import { CampaignKitCard } from "@/components/cockpit/campaign/campaign-kit-card";
import { CampaignWorkflowDiagram } from "@/components/cockpit/campaign/campaign-workflow-diagram";
import { CampaignDistributionGuide } from "@/components/cockpit/campaign/campaign-distribution-guide";
import { CampaignMeasureBridge } from "@/components/cockpit/campaign/campaign-measure-bridge";
import { CampaignPlaybookBridge } from "@/components/cockpit/campaign/campaign-playbook-bridge";
import { ModuleCalloutsList } from "@/components/cockpit/module-callouts-list";
import { usePortfolio } from "@/contexts/portfolio-context";
import {
  getActiveCampaignKit,
  getActiveCampaignToolId,
} from "@/lib/portfolio";
import { getCampaignJourneyState } from "@/lib/campaign/journey";
import {
  recommendPrimaryChannel,
  recommendProfile,
} from "@/lib/campaign/recommend";
import { getCampaignTool } from "@/lib/campaign/tools";
import { buildWorkflowForStack } from "@/lib/campaign/workflows";
import { buildModuleCallouts } from "@/lib/cockpit-callouts";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import { getCockpitHref } from "@/lib/cockpit-modules";

export function CampaignModule({
  project,
  opportunity,
  data,
  onModuleChange,
  onConnectIntegration,
}: CockpitModuleProps) {
  const {
    setMarketingProfile,
    setStrategyBriefForProject,
    setCampaignChannel,
    setCampaignKitForProject,
    switchCampaignTool,
    addCampaignTool,
    removeCampaignTool,
    acknowledgeCampaignDistribution,
    acknowledgeCampaignMeasure,
    restoreCampaignVersion,
    resetCampaign,
  } = usePortfolio();

  const [toolDialogOpen, setToolDialogOpen] = useState(false);

  const suggestedChannel = recommendPrimaryChannel(opportunity);
  const suggestedProfile = recommendProfile(opportunity, suggestedChannel);

  const profile: MarketingProfile =
    project.marketingProfile ?? project.campaignSetup?.profile ?? suggestedProfile;
  const channel: ExtendedChannelKey =
    project.campaignSetup?.primaryChannel ?? suggestedChannel;
  const strategyBrief = project.campaignSetup?.strategyBrief;
  const activeToolId = getActiveCampaignToolId(project);
  const activeKit = getActiveCampaignKit(project);
  const activeTool = activeToolId ? getCampaignTool(activeToolId) : undefined;
  const hasStrategy = Boolean(strategyBrief?.trim());
  const hasStarted = Boolean(
    project.campaignSetup?.activeToolIds?.length || activeToolId,
  );

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

  const handleProfileSelect = useCallback(
    (p: MarketingProfile) => {
      setMarketingProfile(project.id, p);
    },
    [project.id, setMarketingProfile],
  );

  const handleChannelSelect = useCallback(
    (c: ExtendedChannelKey) => {
      setCampaignChannel(project.id, c);
    },
    [project.id, setCampaignChannel],
  );

  const handleStrategyGenerated = useCallback(
    (brief: string) => {
      setStrategyBriefForProject(project.id, brief, channel, profile);
    },
    [project.id, channel, profile, setStrategyBriefForProject],
  );

  const handleToolSelect = useCallback(
    (tool: CampaignTool) => {
      if (!hasStarted) {
        addCampaignTool(project.id, tool.id);
      } else {
        switchCampaignTool(project.id, tool.id);
      }
    },
    [project.id, hasStarted, addCampaignTool, switchCampaignTool],
  );

  const handleKitGenerated = useCallback(
    (kit: CampaignKit) => {
      setCampaignKitForProject(project.id, kit);
    },
    [project.id, setCampaignKitForProject],
  );

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

      <CampaignPlaybookBridge onModuleChange={onModuleChange} />

      <CampaignChannelCard
        opportunity={opportunity}
        selected={channel}
        onSelect={handleChannelSelect}
      />

      <CampaignProfilePicker
        selected={project.marketingProfile ?? project.campaignSetup?.profile}
        suggested={suggestedProfile}
        onSelect={handleProfileSelect}
      />

      {profile ? (
        <CampaignStrategyCard
          project={project}
          opportunity={opportunity}
          profile={profile}
          channel={channel}
          strategyBrief={strategyBrief}
          onGenerated={handleStrategyGenerated}
        />
      ) : null}

      {hasStrategy ? (
        <section aria-label="Création" className="space-y-3">
          {!hasStarted ? (
            <CampaignToolPicker
              project={project}
              opportunity={opportunity}
              profile={profile}
              channel={channel}
              selectedToolIds={project.campaignSetup?.activeToolIds}
              onSelect={handleToolSelect}
            />
          ) : (
            <>
              <CampaignToolSwitcher
                project={project}
                onSwitch={(id) => switchCampaignTool(project.id, id)}
                onRemove={(id) => removeCampaignTool(project.id, id)}
                onAddTool={() => setToolDialogOpen(true)}
              />
              <CampaignToolPickerDialog
                open={toolDialogOpen}
                onOpenChange={setToolDialogOpen}
                project={project}
                opportunity={opportunity}
                profile={profile}
                channel={channel}
                selectedToolIds={project.campaignSetup?.activeToolIds}
                onSelect={handleToolSelect}
              />
              <CampaignWorkflowDiagram workflow={workflow} />
            </>
          )}

          {activeTool ? (
            <CampaignKitCard
              tool={activeTool}
              opportunity={opportunity}
              project={project}
              channel={channel}
              profile={profile}
              kit={activeKit}
              strategyBrief={strategyBrief}
              onGenerated={handleKitGenerated}
              onRestoreVersion={(savedAt) => restoreCampaignVersion(project.id, savedAt)}
              onReset={(opts) => resetCampaign(project.id, opts)}
            />
          ) : null}
        </section>
      ) : null}

      {journey.currentStep >= 3 && activeKit?.primaryPrompt ? (
        <CampaignDistributionGuide
          project={project}
          channel={channel}
          profile={profile}
          distributionSteps={activeKit.distributionSteps}
          onConnectIntegration={(id) => onConnectIntegration(id)}
          onModuleChange={onModuleChange}
          onAcknowledge={() => acknowledgeCampaignDistribution(project.id)}
        />
      ) : null}

      {journey.currentStep >= 4 || project.campaignSetup?.distributionAcknowledgedAt ? (
        <CampaignMeasureBridge
          project={project}
          channel={channel}
          profile={profile}
          onModuleChange={onModuleChange}
          onConnectIntegration={(id) => onConnectIntegration(id)}
          onAcknowledge={() => acknowledgeCampaignMeasure(project.id)}
        />
      ) : null}

      <ModuleCalloutsList callouts={callouts} onModuleChange={onModuleChange} />
    </div>
  );
}

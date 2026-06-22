"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import { canAccessDiffusionPhase, getDiffusionBlockers } from "@/lib/campaign/infra-gates";
import { CampaignSequenceBoard } from "@/components/cockpit/campaign/campaign-sequence-board";
import { CampaignDistributionGuide } from "@/components/cockpit/campaign/campaign-distribution-guide";
import { CampaignConnectorStrip } from "@/components/cockpit/campaign/campaign-connector-strip";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { buildCampaignUtmUrl } from "@/lib/campaign/utm";
import type { ConnectorId } from "@/lib/connectors/types";
import type { CampaignPlaybookId } from "@/lib/campaign/playbooks";

type CampaignDiffusionScreenProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  onToggleSequenceStep: (stepId: string) => void;
  onOpenTool: (id: string, url?: string) => void;
  onConnectIntegration: (id: ConnectorId) => void;
  onConfigureTracking: () => void;
  onAcknowledgeDistribution: () => void;
  onContinue: () => void;
};

export function CampaignDiffusionScreen({
  project,
  opportunity,
  stage,
  channel,
  onToggleSequenceStep,
  onOpenTool,
  onConnectIntegration,
  onConfigureTracking,
  onAcknowledgeDistribution,
  onContinue,
}: CampaignDiffusionScreenProps) {
  const setup = project.campaignSetup;
  const motion = recommendGtmMotion(stage, channel, setup);
  const canDiffuse = canAccessDiffusionPhase(project, motion);
  const blockers = getDiffusionBlockers(project, motion);
  const utm =
    setup?.trackingPlan?.utmBase ??
    buildCampaignUtmUrl(
      project.hostConnection?.productionUrl ?? "https://votre-site.fr",
      channel,
      setup?.activeSequenceId,
    );
  const playbookId = (channel === "cold_email" ? channel : channel) as CampaignPlaybookId;

  if (!canDiffuse) {
    return (
      <div id="diffusion-screen" className="space-y-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-900 dark:text-amber-100">
          Complétez les prérequis infra avant de diffuser :
          <ul className="mt-2 list-inside list-disc">
            {blockers.map((b) => (
              <li key={b.id}>{b.label}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div id="diffusion-screen" className="space-y-4">
      <CampaignSequenceBoard
        project={project}
        onToggleStep={onToggleSequenceStep}
        onOpenTool={onOpenTool}
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">URL UTM campagne</p>
          <CopyButton text={utm} label="Copier UTM" copiedLabel="Copié" />
        </div>
        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{utm}</p>
        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={onConfigureTracking}>
          Enregistrer le tracking
        </Button>
      </div>

      <CampaignDistributionGuide
        playbookId={playbookId}
        kitSteps={setup?.kitsByTool ? Object.values(setup.kitsByTool)[0]?.distributionSteps : undefined}
        acknowledged={Boolean(setup?.distributionAcknowledgedAt)}
        onAcknowledge={onAcknowledgeDistribution}
      />

      <CampaignConnectorStrip
        project={project}
        stage={stage}
        channel={channel}
        onConnect={onConnectIntegration}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={onContinue}>
          Passer à la mesure
        </Button>
      </div>
    </div>
  );
}

"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import { CampaignInfraGates } from "@/components/cockpit/campaign/campaign-infra-gates";
import { CampaignKitSection } from "@/components/cockpit/campaign/campaign-kit-section";
import { CampaignWorkflowDiagram } from "@/components/cockpit/campaign/campaign-workflow-diagram";
import type { CampaignWorkflowNode } from "@/lib/campaign/workflows";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { InfraGateId } from "@/lib/campaign/infra-gates";
import { isCreationComplete } from "@/lib/campaign/phases";

const DEFAULT_ASSETS = [
  "Promesse claire sur la landing",
  "Copy canal prioritaire validée",
  "Visuel ou vidéo principale",
  "UTM prêt à coller",
];

type CampaignCreationScreenProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  strategyBrief?: string;
  activeTool?: CampaignTool;
  activeKit?: CampaignKit;
  workflow: CampaignWorkflowNode[];
  onSelectTool: (tool: CampaignTool) => void;
  onKitGenerated: (kit: CampaignKit, strategyBrief?: string) => void;
  onRestoreVersion: (savedAt: string) => void;
  onReset: (opts?: { keepStrategy?: boolean }) => void;
  onToggleAsset: (index: number) => void;
  onToggleInfraGate: (gateId: InfraGateId) => void;
  onContinue: () => void;
};

export function CampaignCreationScreen({
  project,
  opportunity,
  stage,
  channel,
  profile,
  strategyBrief,
  activeTool,
  activeKit,
  workflow,
  onSelectTool,
  onKitGenerated,
  onRestoreVersion,
  onReset,
  onToggleAsset,
  onToggleInfraGate,
  onContinue,
}: CampaignCreationScreenProps) {
  const motion = recommendGtmMotion(stage, channel, project.campaignSetup);
  const assets = project.campaignSetup?.assetChecklist ?? [];
  const complete = isCreationComplete(project);

  return (
    <div id="creation-screen" className="space-y-4">
      {workflow.length > 1 ? (
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold">Workflow outils</h3>
          <div className="mt-3">
            <CampaignWorkflowDiagram workflow={workflow} />
          </div>
        </section>
      ) : null}

      <CampaignKitSection
        project={project}
        opportunity={opportunity}
        stage={stage}
        channel={channel}
        profile={profile}
        strategyBrief={strategyBrief}
        activeTool={activeTool}
        activeKit={activeKit}
        onSelectTool={onSelectTool}
        onKitGenerated={onKitGenerated}
        onRestoreVersion={onRestoreVersion}
        onReset={onReset}
      />

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold">Checklist assets</h3>
        <ul className="mt-3 space-y-2">
          {DEFAULT_ASSETS.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <Checkbox
                checked={Boolean(assets[i])}
                onCheckedChange={() => onToggleAsset(i)}
              />
              <span className="text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <CampaignInfraGates
        project={project}
        motion={motion}
        onToggleGate={onToggleInfraGate}
      />

      {complete ? (
        <div className="flex justify-end">
          <Button type="button" onClick={onContinue}>
            Continuer → Diffusion
          </Button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback } from "react";
import { ChevronDown } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { CampaignTool } from "@/lib/campaign/tools";
import { isFoundationsComplete } from "@/lib/campaign/phases";
import { getCreationGaps, isCreationComplete } from "@/lib/campaign/phases";
import { CampaignKitSection } from "@/components/cockpit/campaign/campaign-kit-section";
import { CampaignContentStudio } from "@/components/cockpit/campaign/campaign-content-studio";
import { CampaignWorkflowDiagram } from "@/components/cockpit/campaign/campaign-workflow-diagram";
import { CampaignPhaseGaps } from "@/components/cockpit/campaign/campaign-phase-gaps";
import type { CampaignWorkflowNode } from "@/lib/campaign/workflows";
import { Button } from "@/components/ui/button";

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
  onStartContentStudio: () => void;
  onConfirmContentAsset: (assetId: string, fields: Record<string, string>) => void;
  onContinue: () => void;
  onGoToFoundations: () => void;
  onNavigate?: (anchorId: string) => void;
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
  onStartContentStudio,
  onConfirmContentAsset,
  onContinue,
  onGoToFoundations,
  onNavigate,
}: CampaignCreationScreenProps) {
  const setup = project.campaignSetup;
  const foundationsReady = isFoundationsComplete(setup);
  const complete = isCreationComplete(project, opportunity);
  const gaps = getCreationGaps(project, opportunity);

  const handleStartStudio = useCallback(() => {
    onStartContentStudio();
  }, [onStartContentStudio]);

  return (
    <div id="creation-screen" className="space-y-4">
      {!complete ? <CampaignPhaseGaps gaps={gaps} onGapClick={onNavigate} /> : null}

      {!foundationsReady ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <p className="font-data text-[10px] uppercase tracking-data text-primary">Phase 2 · Création</p>
          <h3 className="mt-1 text-lg font-semibold">On fabrique vos contenus</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Commencez par les Fondations : audience, objectif et message. Ensuite, l&apos;atelier
            pré-remplit landing et canaux — vous n&apos;aurez qu&apos;à valider avec « C&apos;est prêt ».
          </p>
          <Button type="button" className="mt-4" onClick={onGoToFoundations}>
            Aller aux Fondations
          </Button>
        </section>
      ) : (
        <CampaignContentStudio
          project={project}
          opportunity={opportunity}
          onStartStudio={handleStartStudio}
          onConfirmAsset={onConfirmContentAsset}
          onContinue={onContinue}
          creationComplete={complete}
        />
      )}

      <details className="group rounded-xl border border-border bg-card shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
          <div>
            <h3 className="text-sm font-semibold">Aller plus loin avec l&apos;IA</h3>
            <p className="text-xs text-muted-foreground">Variantes et prompts optionnels</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border px-5 pb-5 pt-3">
          <div id="creation-kit">
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
          </div>
        </div>
      </details>

      {workflow.length > 1 ? (
        <details className="group rounded-xl border border-border bg-card shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
            <h3 className="text-sm font-semibold">Comment ça s&apos;enchaîne (outils)</h3>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border px-5 pb-5 pt-3">
            <CampaignWorkflowDiagram workflow={workflow} />
          </div>
        </details>
      ) : null}
    </div>
  );
}

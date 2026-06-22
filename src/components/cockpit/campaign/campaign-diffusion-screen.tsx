"use client";

import Link from "next/link";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import { getDiffusionGaps, isDiffusionComplete, mapInfraGateToAction } from "@/lib/campaign/phases";
import { getConfirmedContentAssets, formatContentAssetAsMarkdown } from "@/lib/campaign/content-derive";
import { CampaignSequenceBoard } from "@/components/cockpit/campaign/campaign-sequence-board";
import { CampaignDistributionGuide } from "@/components/cockpit/campaign/campaign-distribution-guide";
import { CampaignInfraGates } from "@/components/cockpit/campaign/campaign-infra-gates";
import { CampaignConnectorStrip } from "@/components/cockpit/campaign/campaign-connector-strip";
import { CampaignPhaseGaps } from "@/components/cockpit/campaign/campaign-phase-gaps";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { buildCampaignUtmUrl } from "@/lib/campaign/utm";
import { getCockpitHref } from "@/lib/cockpit-modules";
import type { ConnectorId } from "@/lib/connectors/types";
import type { CampaignPlaybookId } from "@/lib/campaign/playbooks";
import type { InfraGateId } from "@/lib/campaign/infra-gates";
import { getDiffusionBlockers } from "@/lib/campaign/infra-gates";

type CampaignDiffusionScreenProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  onConfirmSequenceStep: (stepId: string) => void;
  onConfirmDistributionStep: (stepIndex: number) => void;
  onOpenTool: (id: string, url?: string) => void;
  onConnectIntegration: (id: ConnectorId) => void;
  onConfigureTracking: () => void;
  onConfirmInfraGate: (gateId: InfraGateId) => void;
  onEnableAttribution: () => void;
  onContinue: () => void;
  onNavigate?: (anchorId: string) => void;
};

export function CampaignDiffusionScreen({
  project,
  stage,
  channel,
  onConfirmSequenceStep,
  onConfirmDistributionStep,
  onOpenTool,
  onConnectIntegration,
  onConfigureTracking,
  onConfirmInfraGate,
  onEnableAttribution,
  onContinue,
  onNavigate,
}: CampaignDiffusionScreenProps) {
  const setup = project.campaignSetup;
  const motion = recommendGtmMotion(stage, channel, setup);
  const blockers = getDiffusionBlockers(project, motion);
  const gaps = getDiffusionGaps(project);
  const diffusionComplete = isDiffusionComplete(project);
  const utm =
    setup?.trackingPlan?.utmBase ??
    buildCampaignUtmUrl(
      project.hostConnection?.productionUrl ?? "https://votre-site.fr",
      channel,
      setup?.activeSequenceId,
    );
  const playbookId = channel as CampaignPlaybookId;
  const confirmedContent = getConfirmedContentAssets(setup?.contentAssets ?? {});
  const channelAsset = confirmedContent.find((a) => a.channel === channel);
  const channelHook =
    channelAsset?.fields.find((f) =>
      ["hook", "headline1", "primaryText", "hook3s", "h1"].includes(f.key),
    )?.value ??
    confirmedContent.find((a) => a.id === "landing")?.fields.find((f) => f.key === "h1")?.value;

  return (
    <div id="diffusion-screen" className="space-y-4">
      {!diffusionComplete ? (
        <CampaignPhaseGaps gaps={gaps} onGapClick={onNavigate} title="Il reste à faire" />
      ) : null}

      {blockers.length > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Configurez le minimum technique avant de lancer
          </p>
          <ul className="mt-3 space-y-2">
            {blockers.map((b) => {
              const action = mapInfraGateToAction(b);
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>{b.label}</span>
                  {b.id === "app_live" ? (
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link href={getCockpitHref(project.id, "build")}>{action.ctaLabel}</Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate?.(action.anchorId)}
                    >
                      {action.ctaLabel}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {confirmedContent.length > 0 ? (
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="font-data text-[10px] uppercase tracking-data text-primary">Vos contenus</p>
          <h3 className="mt-1 text-sm font-semibold">Prêts à coller dans vos outils</h3>
          <ul className="mt-3 space-y-3">
            {confirmedContent.map((asset) => (
              <li key={asset.id} className="rounded-lg border border-border/70 bg-muted/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{asset.label}</p>
                  <CopyButton
                    text={formatContentAssetAsMarkdown(asset)}
                    label="Copier"
                    copiedLabel="Copié"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CampaignInfraGates
        project={project}
        motion={motion}
        onConnectIntegration={onConnectIntegration}
        onConfirmGate={onConfirmInfraGate}
        onConfigureTracking={onConfigureTracking}
        onEnableAttribution={onEnableAttribution}
        onNavigate={onNavigate}
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">URL UTM campagne</p>
          <CopyButton text={utm} label="Copier UTM" copiedLabel="Copié" />
        </div>
        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{utm}</p>
        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={onConfigureTracking}>
          UTM enregistré — c&apos;est fait
        </Button>
      </div>

      <CampaignSequenceBoard
        project={project}
        onConfirmStep={onConfirmSequenceStep}
        onOpenTool={onOpenTool}
      />

      <CampaignDistributionGuide
        project={project}
        playbookId={playbookId}
        kitSteps={setup?.kitsByTool ? Object.values(setup.kitsByTool)[0]?.distributionSteps : undefined}
        channelHook={channelHook}
        onConfirmStep={onConfirmDistributionStep}
      />

      <CampaignConnectorStrip
        project={project}
        stage={stage}
        channel={channel}
        onConnect={onConnectIntegration}
      />

      {diffusionComplete ? (
        <div className="flex justify-end">
          <Button type="button" onClick={onContinue}>
            Passer à la mesure
          </Button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Validez chaque étape de la séquence et du guide avec « C&apos;est fait » pour continuer.
        </p>
      )}
    </div>
  );
}

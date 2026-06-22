"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import type { ConfirmFoundationsRiverPayload } from "@/lib/portfolio";
import {
  buildFoundationsRiverDraft,
  deriveStageAndMotionForGoal,
  getFoundationsRiverProgressIndex,
  goalPayloadToSmartGoal,
  isLegacyFoundationsDataComplete,
  resolveFoundationsRiverStop,
  type FoundationsRiverStopId,
} from "@/lib/campaign/foundations-river";
import { CampaignRiverProgress } from "@/components/cockpit/campaign/campaign-river-progress";
import { CampaignFoundationsRiverStopAudience } from "@/components/cockpit/campaign/campaign-foundations-river-stop-audience";
import { CampaignFoundationsRiverStopGoal } from "@/components/cockpit/campaign/campaign-foundations-river-stop-goal";
import { CampaignFoundationsRiverStopMessage } from "@/components/cockpit/campaign/campaign-foundations-river-stop-message";
import { CampaignFoundationsRiverDock } from "@/components/cockpit/campaign/campaign-foundations-river-dock";
import { CampaignRiverAdvancedSheet } from "@/components/cockpit/campaign/campaign-river-advanced-sheet";
import { Button } from "@/components/ui/button";

type CampaignFoundationsRiverProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  strategyBrief?: string;
  suggestScale: boolean;
  initialStop?: FoundationsRiverStopId;
  onConfirmStop: (payload: ConfirmFoundationsRiverPayload) => void;
  onBriefGenerated: (brief: string) => void;
  onStageSelect: (stage: AcquisitionStage) => void;
  onResetStageToRecommended?: () => void;
  onMotionChange: (motion: GtmMotion) => void;
  onProfileChange: (profile: MarketingProfile) => void;
  onIcpStructuredSave: (
    icp: import("@/lib/campaign/kits").CampaignIcpStructured,
    summary: string,
  ) => void;
  onAttributionChange: (enabled: boolean) => void;
  onContinue: () => void;
};

export function CampaignFoundationsRiver({
  project,
  opportunity,
  stage,
  channel,
  profile,
  strategyBrief,
  suggestScale,
  initialStop,
  onConfirmStop,
  onBriefGenerated,
  onStageSelect,
  onResetStageToRecommended,
  onMotionChange,
  onProfileChange,
  onIcpStructuredSave,
  onAttributionChange,
  onContinue,
}: CampaignFoundationsRiverProps) {
  const resolvedStop = resolveFoundationsRiverStop(project);
  const [stop, setStop] = useState<FoundationsRiverStopId>(initialStop ?? resolvedStop);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const legacyReady =
    isLegacyFoundationsDataComplete(project.campaignSetup) &&
    !project.campaignSetup?.foundationsRiver?.startedAt;

  const draft = useMemo(
    () => buildFoundationsRiverDraft(project, opportunity, stage),
    [project, opportunity, stage],
  );

  useEffect(() => {
    if (initialStop) setStop(initialStop);
  }, [initialStop]);

  useEffect(() => {
    document.getElementById("foundations-screen")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stop]);

  const progressIndex = getFoundationsRiverProgressIndex(stop);

  const fetchBrief = useCallback(async (): Promise<string | undefined> => {
    try {
      const res = await fetch("/api/campaign/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          opportunitySlug: opportunity.slug,
          productName: project.productName ?? opportunity.name,
          profile,
          channelKey: project.campaignSetup?.primaryChannel ?? channel,
          acquisitionStage: stage,
          language: "fr",
        }),
      });
      const data = (await res.json()) as { strategyBrief?: string; error?: string };
      if (res.ok && data.strategyBrief) {
        onBriefGenerated(data.strategyBrief);
        return data.strategyBrief;
      }
    } catch {
      /* non bloquant */
    }
    return undefined;
  }, [project, opportunity, profile, channel, stage, onBriefGenerated]);

  function handleDockContinue() {
    onConfirmStop({ stop: "dock" });
    onContinue();
  }

  return (
    <div id="foundations-screen" className="space-y-4">
      {stop !== "intro" && stop !== "dock" && progressIndex >= 0 ? (
        <CampaignRiverProgress activeIndex={progressIndex} />
      ) : null}

      {stop === "intro" ? (
        <section className="animate-in fade-in rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-lg font-semibold">Posons les bases de votre campagne</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            On part de{" "}
            <span className="font-medium text-foreground">
              {project.productName ?? opportunity.name}
            </span>
            {opportunity.targetClient ? (
              <>
                {" "}
                pour{" "}
                <span className="font-medium text-foreground">{opportunity.targetClient}</span>
              </>
            ) : null}
            . Trois étapes guidées, puis l&apos;atelier contenu — on vous accompagne jusqu&apos;au lancement.
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => {
              onConfirmStop({ stop: "start" });
              setStop("audience");
            }}
          >
            Commencer
          </Button>
        </section>
      ) : null}

      {stop === "audience" ? (
        <CampaignFoundationsRiverStopAudience
          draft={draft.audience}
          productName={project.productName ?? opportunity.name}
          onConfirm={(payload) => {
            onConfirmStop({
              stop: "audience",
              who: payload.who,
              pain: payload.pain,
              icpSummary: payload.icpSummary,
            });
            setStop("goal");
          }}
        />
      ) : null}

      {stop === "goal" ? (
        <CampaignFoundationsRiverStopGoal
          draft={draft.goal}
          audienceWho={draft.audience.who}
          productName={project.productName ?? opportunity.name}
          stage={stage}
          clientsFromScenario={
            opportunity.financialScenarios?.find((s) => s.name === "Réaliste")?.clients
          }
          onConfirm={({ strategyId, draft: goalDraft }) => {
            const { stage: nextStage, motion, profile: nextProfile } = deriveStageAndMotionForGoal(
              project,
              opportunity,
              goalDraft.channel,
            );
            onConfirmStop({
              stop: "goal",
              smartGoal: goalPayloadToSmartGoal(goalDraft),
              channel: goalDraft.channel,
              goalStrategyId: strategyId,
              supportChannels: goalDraft.supportChannels,
              stage: nextStage,
              motion,
              profile: nextProfile,
            });
            setStop("message");
          }}
          onBack={() => setStop("audience")}
          onOpenAdvanced={() => setAdvancedOpen(true)}
        />
      ) : null}

      {stop === "message" ? (
        <CampaignFoundationsRiverStopMessage
          draft={draft.message}
          productName={project.productName ?? opportunity.name}
          audienceWho={draft.audience.who}
          audiencePain={draft.audience.pain}
          goalRecapLabel={draft.goal.recapLabel}
          primaryChannel={draft.goal.channel}
          supportChannels={draft.goal.supportChannels}
          onConfirm={({ positioning, messageAdaptations }) => {
            onConfirmStop({ stop: "message", positioning, messageAdaptations });
            void fetchBrief();
            setStop("dock");
          }}
          onBack={() => setStop("goal")}
        />
      ) : null}

      {stop === "dock" ? (
        <CampaignFoundationsRiverDock
          project={project}
          opportunity={opportunity}
          legacyReady={legacyReady}
          onContinue={handleDockContinue}
          onOpenAdvanced={() => setAdvancedOpen(true)}
        />
      ) : null}

      <CampaignRiverAdvancedSheet
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        project={project}
        opportunity={opportunity}
        stage={stage}
        channel={channel}
        profile={profile}
        suggestScale={suggestScale}
        onStageSelect={onStageSelect}
        onResetStageToRecommended={onResetStageToRecommended}
        onMotionChange={onMotionChange}
        onProfileChange={onProfileChange}
        onIcpStructuredSave={onIcpStructuredSave}
        onAttributionChange={onAttributionChange}
      />
    </div>
  );
}

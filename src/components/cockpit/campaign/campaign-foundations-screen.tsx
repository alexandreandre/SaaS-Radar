"use client";

import Link from "next/link";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { CampaignSmartGoal } from "@/lib/campaign/kits";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import type { MarketingProfile } from "@/lib/campaign/tools";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import { CampaignStageBanner } from "@/components/cockpit/campaign/campaign-stage-banner";
import { CampaignGoalCard } from "@/components/cockpit/campaign/campaign-goal-card";
import { CampaignMessageCard } from "@/components/cockpit/campaign/campaign-message-card";
import { CampaignMotionPicker } from "@/components/cockpit/campaign/campaign-motion-picker";
import { CampaignIcpForm } from "@/components/cockpit/campaign/campaign-icp-form";
import { CampaignAttributionField } from "@/components/cockpit/campaign/campaign-attribution-field";
import { Button } from "@/components/ui/button";
import { getCockpitHref } from "@/lib/cockpit-modules";
import { isFoundationsComplete } from "@/lib/campaign/phases";
import { getStageGuidance } from "@/lib/campaign/stage-guidance";

type CampaignFoundationsScreenProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  strategyBrief?: string;
  suggestScale: boolean;
  onStageSelect: (stage: AcquisitionStage) => void;
  onResetStageToRecommended?: () => void;
  onChannelSelect: (channel: ExtendedChannelKey) => void;
  onSaveGoal: (goal: CampaignSmartGoal, icp: string) => void;
  onApplyFullPlan?: (data: {
    smartGoal: CampaignSmartGoal;
    icpSummary: string;
    positioning: string;
    strategyBrief: string;
    actionItems?: import("@/lib/campaign/stages").CampaignActionItem[];
    activeSequenceId?: string;
  }) => void;
  onPositioningChange: (value: string) => void;
  onBriefGenerated: (brief: string) => void;
  onMotionChange: (motion: GtmMotion) => void;
  onProfileChange: (profile: MarketingProfile) => void;
  onIcpStructuredSave: (icp: import("@/lib/campaign/kits").CampaignIcpStructured, summary: string) => void;
  onAttributionChange: (enabled: boolean) => void;
  onContinue: () => void;
};

export function CampaignFoundationsScreen({
  project,
  opportunity,
  stage,
  channel,
  profile,
  strategyBrief,
  suggestScale,
  onStageSelect,
  onResetStageToRecommended,
  onChannelSelect,
  onSaveGoal,
  onApplyFullPlan,
  onPositioningChange,
  onBriefGenerated,
  onMotionChange,
  onProfileChange,
  onIcpStructuredSave,
  onAttributionChange,
  onContinue,
}: CampaignFoundationsScreenProps) {
  const setup = project.campaignSetup;
  const motion = recommendGtmMotion(stage, channel, setup);
  const complete = isFoundationsComplete(setup);
  const stageGuidance = getStageGuidance(project, channel);

  return (
    <div id="foundations-screen" className="space-y-4">
      <CampaignStageBanner
        guidance={stageGuidance}
        suggestScale={suggestScale}
        onStageSelect={onStageSelect}
        onResetToRecommended={onResetStageToRecommended}
      />

      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
        <Link
          href={getCockpitHref(project.id, "playbook")}
          className="font-medium text-primary underline"
        >
          Voir la fiche Idée
        </Link>
        <span className="text-muted-foreground"> — tactiques, CAC et concurrents.</span>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold">Motion & profil</h3>
        <div className="mt-3">
          <CampaignMotionPicker
            motion={setup?.gtmMotion ?? motion}
            profile={setup?.marketingProfile ?? profile}
            onMotionChange={onMotionChange}
            onProfileChange={onProfileChange}
          />
        </div>
      </section>

      <CampaignGoalCard
        project={project}
        opportunity={opportunity}
        stage={stage}
        channel={channel}
        smartGoal={setup?.smartGoal}
        icpSummary={setup?.icpSummary}
        onChannelSelect={onChannelSelect}
        onSave={onSaveGoal}
        onApplyFullPlan={onApplyFullPlan}
      />

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold">ICP structuré</h3>
        <div className="mt-3">
          <CampaignIcpForm
            icp={setup?.icpStructured}
            icpSummary={setup?.icpSummary}
            onSave={onIcpStructuredSave}
          />
        </div>
      </section>

      <CampaignMessageCard
        project={project}
        opportunity={opportunity}
        stage={stage}
        channel={channel}
        profile={profile}
        positioning={setup?.positioning}
        strategyBrief={strategyBrief}
        onPositioningChange={onPositioningChange}
        onBriefGenerated={onBriefGenerated}
      />

      <CampaignAttributionField
        enabled={Boolean(setup?.attributionQuestionEnabled)}
        onChange={onAttributionChange}
      />

      {complete ? (
        <div className="flex justify-end">
          <Button type="button" onClick={onContinue}>
            Valider → Création
          </Button>
        </div>
      ) : null}
    </div>
  );
}

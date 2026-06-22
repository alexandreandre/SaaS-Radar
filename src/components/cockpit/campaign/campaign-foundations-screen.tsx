"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import type { ConfirmFoundationsRiverPayload } from "@/lib/portfolio";
import type { FoundationsRiverStopId } from "@/lib/campaign/foundations-river";
import { CampaignFoundationsRiver } from "@/components/cockpit/campaign/campaign-foundations-river";

type CampaignFoundationsScreenProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  strategyBrief?: string;
  suggestScale: boolean;
  initialRiverStop?: FoundationsRiverStopId;
  onStageSelect: (stage: AcquisitionStage) => void;
  onResetStageToRecommended?: () => void;
  onConfirmRiverStop: (payload: ConfirmFoundationsRiverPayload) => void;
  onBriefGenerated: (brief: string) => void;
  onMotionChange: (motion: GtmMotion) => void;
  onProfileChange: (profile: MarketingProfile) => void;
  onIcpStructuredSave: (
    icp: import("@/lib/campaign/kits").CampaignIcpStructured,
    summary: string,
  ) => void;
  onAttributionChange: (enabled: boolean) => void;
  onContinue: () => void;
};

export function CampaignFoundationsScreen(props: CampaignFoundationsScreenProps) {
  return <CampaignFoundationsRiver {...props} onConfirmStop={props.onConfirmRiverStop} />;
}

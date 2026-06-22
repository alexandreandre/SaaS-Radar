"use client";

import Link from "next/link";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import { getStageGuidance } from "@/lib/campaign/stage-guidance";
import { CampaignStageBanner } from "@/components/cockpit/campaign/campaign-stage-banner";
import { CampaignMotionPicker } from "@/components/cockpit/campaign/campaign-motion-picker";
import { CampaignIcpForm } from "@/components/cockpit/campaign/campaign-icp-form";
import { CampaignAttributionField } from "@/components/cockpit/campaign/campaign-attribution-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCockpitHref } from "@/lib/cockpit-modules";

type CampaignRiverAdvancedSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  suggestScale?: boolean;
  onStageSelect: (stage: AcquisitionStage) => void;
  onResetStageToRecommended?: () => void;
  onMotionChange: (motion: GtmMotion) => void;
  onProfileChange: (profile: MarketingProfile) => void;
  onIcpStructuredSave: (
    icp: import("@/lib/campaign/kits").CampaignIcpStructured,
    summary: string,
  ) => void;
  onAttributionChange: (enabled: boolean) => void;
};

export function CampaignRiverAdvancedSheet({
  open,
  onOpenChange,
  project,
  opportunity,
  stage,
  channel,
  profile,
  suggestScale,
  onStageSelect,
  onResetStageToRecommended,
  onMotionChange,
  onProfileChange,
  onIcpStructuredSave,
  onAttributionChange,
}: CampaignRiverAdvancedSheetProps) {
  const setup = project.campaignSetup;
  const motion = recommendGtmMotion(stage, channel, setup);
  const guidance = getStageGuidance(project, channel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajuster la stratégie</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <CampaignStageBanner
            guidance={guidance}
            suggestScale={suggestScale}
            onStageSelect={onStageSelect}
            onResetToRecommended={onResetStageToRecommended}
          />
          <CampaignMotionPicker
            motion={setup?.gtmMotion ?? motion}
            profile={setup?.marketingProfile ?? profile}
            onMotionChange={onMotionChange}
            onProfileChange={onProfileChange}
          />
          <div>
            <p className="mb-2 text-sm font-semibold">ICP détaillé</p>
            <CampaignIcpForm
              icp={setup?.icpStructured}
              icpSummary={setup?.icpSummary}
              onSave={onIcpStructuredSave}
            />
          </div>
          <CampaignAttributionField
            enabled={Boolean(setup?.attributionQuestionEnabled)}
            onEnable={() => onAttributionChange(true)}
          />
          <Link
            href={getCockpitHref(project.id, "playbook")}
            className="block text-sm font-medium text-primary underline"
          >
            Voir la fiche Idée (CAC, concurrents)
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

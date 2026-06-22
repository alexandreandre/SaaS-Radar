import type { UserProject } from "@/lib/portfolio";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { hasCampaignKit } from "@/lib/campaign/kits";
import {
  type AcquisitionStage,
  stageFromLegacyProfile,
} from "@/lib/campaign/stages";
import type { MarketingProfile } from "@/lib/campaign/tools";

function hasAdsSpend(project: UserProject): boolean {
  return (project.campaigns ?? []).some((c) => c.totalSpend > 0);
}

function hasOutreachKit(project: UserProject): boolean {
  const kits = project.campaignSetup?.kitsByTool ?? {};
  return Object.values(kits).some(
    (k) =>
      k &&
      (k.toolId === "lemlist" ||
        k.toolId === "apollo" ||
        k.toolId === "smartlead" ||
        k.channelKey === "cold_email"),
  );
}

export function inferAcquisitionStage(
  project: UserProject,
  channel?: ExtendedChannelKey,
  options?: { ignoreOverride?: boolean },
): AcquisitionStage {
  const setup = project.campaignSetup;

  if (!options?.ignoreOverride && setup?.stageOverride && setup.acquisitionStage) {
    return setup.acquisitionStage;
  }

  if (project.currentMrr > 500 || (hasAdsSpend(project) && project.currentMrr > 0)) {
    return "scale";
  }

  if (project.builderStage === "has_mrr" && project.currentMrr > 0) {
    return "content";
  }

  if (hasOutreachKit(project)) {
    return "outreach";
  }

  if (hasCampaignKit(project)) {
    return "outreach";
  }

  const legacyProfile: MarketingProfile | undefined =
    setup?.profile ?? project.marketingProfile;
  if (legacyProfile) {
    return stageFromLegacyProfile(
      legacyProfile,
      channel ?? setup?.primaryChannel,
    );
  }

  return "network";
}

export function suggestScaleStage(project: UserProject): boolean {
  return project.currentMrr > 500 || hasAdsSpend(project);
}

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getCacForChannel } from "@/lib/acquisition-channels";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { resolveExtendedChannelKey } from "@/lib/campaign/channels";
import {
  getCampaignTool,
  getToolsByChannel,
  type CampaignTool,
  type CampaignToolId,
  type MarketingProfile,
} from "@/lib/campaign/tools";
import { defaultToolIdsForChannel } from "@/lib/campaign/workflows";
import {
  type AcquisitionStage,
  type CampaignSmartGoal,
  defaultSmartGoalForStage,
  getStageDefinition,
  isChannelAllowedForStage,
  isToolCategoryHiddenForStage,
  profileFromStage,
} from "@/lib/campaign/stages";
import { getCampaignStage } from "@/lib/campaign/kits";
import { inferAcquisitionStage } from "@/lib/campaign/infer-stage";

export function recommendProfile(
  opportunity: Opportunity,
  channel?: ExtendedChannelKey,
): MarketingProfile {
  const primary = channel ?? recommendPrimaryChannel(opportunity);
  const tabTitle =
    opportunity.acquisition.find((a) => resolveExtendedChannelKey(a.title) === primary)
      ?.title ?? opportunity.acquisition[0]?.title ?? "LinkedIn";
  const cac = getCacForChannel(opportunity.cacChannels, tabTitle);
  const estimate = cac?.estimate ?? 80;

  if (estimate < 50) return "organic";
  if (estimate <= 150) return "paid-light";
  return "paid-scale";
}

export function recommendPrimaryChannel(opportunity: Opportunity): ExtendedChannelKey {
  const first = opportunity.acquisition[0];
  if (!first) return "linkedin";
  return resolveExtendedChannelKey(first.title);
}

export function recommendStageForProject(
  project: UserProject,
  opportunity: Opportunity,
): AcquisitionStage {
  const channel =
    project.campaignSetup?.primaryChannel ?? recommendPrimaryChannel(opportunity);
  if (project.campaignSetup?.acquisitionStage && project.campaignSetup.stageOverride) {
    return project.campaignSetup.acquisitionStage;
  }
  return inferAcquisitionStage(project, channel);
}

export function recommendChannelForStage(
  opportunity: Opportunity,
  stage: AcquisitionStage,
): ExtendedChannelKey {
  const primary = recommendPrimaryChannel(opportunity);
  if (isChannelAllowedForStage(stage, primary)) return primary;

  const fromFiche = opportunity.acquisition
    .map((a) => resolveExtendedChannelKey(a.title))
    .find((c) => isChannelAllowedForStage(stage, c));
  if (fromFiche) return fromFiche;

  return getStageDefinition(stage).allowedChannels[0] ?? "linkedin";
}

export function recommendSmartGoal(stage: AcquisitionStage): CampaignSmartGoal {
  return defaultSmartGoalForStage(stage);
}

export function recommendIcpSummary(opportunity: Opportunity): string {
  const target = opportunity.targetClient?.trim();
  const sector = opportunity.sector;
  const pain =
    opportunity.foreignMarketProfile?.problemSolved ??
    opportunity.pitch;
  if (target) {
    return `${target} — secteur ${sector}. Problème : ${pain.slice(0, 120)}${pain.length > 120 ? "…" : ""}`;
  }
  return `${opportunity.pitch.slice(0, 160)}${opportunity.pitch.length > 160 ? "…" : ""}`;
}

export function recommendTools(
  opportunity: Opportunity,
  profile?: MarketingProfile,
  channel?: ExtendedChannelKey,
  stage?: AcquisitionStage,
): CampaignToolId[] {
  const resolvedStage = stage ?? "network";
  const resolvedChannel =
    channel ??
    recommendChannelForStage(opportunity, resolvedStage);
  const resolvedProfile = profile ?? profileFromStage(resolvedStage);
  const stageTools = getStageDefinition(resolvedStage).recommendedTools;

  const fromStage = stageTools.filter((id) => {
    const tool = getCampaignTool(id);
    if (!tool) return false;
    if (isToolCategoryHiddenForStage(resolvedStage, tool.category)) return false;
    return tool.channels.includes(resolvedChannel) && tool.profiles.includes(resolvedProfile);
  });

  if (fromStage.length > 0) return fromStage.slice(0, 3);

  const defaults = defaultToolIdsForChannel(resolvedChannel);
  const available = getToolsByChannel(resolvedChannel, resolvedProfile)
    .filter((t) => !isToolCategoryHiddenForStage(resolvedStage, t.category))
    .map((t) => t.id);
  const filtered = defaults.filter((id) => available.includes(id));
  if (filtered.length > 0) return filtered;
  return available.slice(0, 2);
}

export function recommendToolsFull(
  opportunity: Opportunity,
  profile?: MarketingProfile,
  channel?: ExtendedChannelKey,
  stage?: AcquisitionStage,
): CampaignTool[] {
  const ids = recommendTools(opportunity, profile, channel, stage);
  return ids.map((id) => getCampaignTool(id)).filter((t): t is CampaignTool => Boolean(t));
}

export function recommendProfileForProject(
  project: UserProject,
  opportunity: Opportunity,
): MarketingProfile {
  void getCampaignStage(project);
  if (project.campaignSetup?.profile) return project.campaignSetup.profile;
  if (project.marketingProfile) return project.marketingProfile;
  const channel =
    project.campaignSetup?.primaryChannel ?? recommendPrimaryChannel(opportunity);
  return profileFromStage(recommendStageForProject(project, opportunity)) ??
    recommendProfile(opportunity, channel);
}

export function filterToolsForStage(
  tools: CampaignTool[],
  stage: AcquisitionStage,
): CampaignTool[] {
  return tools.filter((t) => !isToolCategoryHiddenForStage(stage, t.category));
}

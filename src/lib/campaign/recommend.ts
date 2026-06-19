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

export function recommendTools(
  opportunity: Opportunity,
  profile?: MarketingProfile,
  channel?: ExtendedChannelKey,
): CampaignToolId[] {
  const resolvedChannel = channel ?? recommendPrimaryChannel(opportunity);
  const resolvedProfile = profile ?? recommendProfile(opportunity, resolvedChannel);
  const defaults = defaultToolIdsForChannel(resolvedChannel);
  const available = getToolsByChannel(resolvedChannel, resolvedProfile).map((t) => t.id);
  const filtered = defaults.filter((id) => available.includes(id));
  if (filtered.length > 0) return filtered;
  return available.slice(0, 2).map((t) => t);
}

export function recommendToolsFull(
  opportunity: Opportunity,
  profile?: MarketingProfile,
  channel?: ExtendedChannelKey,
): CampaignTool[] {
  const ids = recommendTools(opportunity, profile, channel);
  return ids.map((id) => getCampaignTool(id)).filter((t): t is CampaignTool => Boolean(t));
}

export function recommendProfileForProject(
  project: UserProject,
  opportunity: Opportunity,
): MarketingProfile {
  if (project.marketingProfile) return project.marketingProfile;
  if (project.campaignSetup?.profile) return project.campaignSetup.profile;
  const channel =
    project.campaignSetup?.primaryChannel ?? recommendPrimaryChannel(opportunity);
  return recommendProfile(opportunity, channel);
}

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

const RIVER_CONVERSATION_PRIORITY: ExtendedChannelKey[] = [
  "linkedin",
  "referral",
  "cold_email",
];

/** Canal rivière — priorise les canaux de conversation en stade early. */
export function recommendRiverChannelForStage(
  opportunity: Opportunity,
  stage: AcquisitionStage,
): ExtendedChannelKey {
  const ficheChannels = opportunity.acquisition
    .map((a) => resolveExtendedChannelKey(a.title))
    .filter((c) => isChannelAllowedForStage(stage, c));

  if (stage === "network" || stage === "outreach") {
    for (const preferred of RIVER_CONVERSATION_PRIORITY) {
      if (ficheChannels.includes(preferred)) return preferred;
    }
  }

  return recommendChannelForStage(opportunity, stage);
}

export function recommendSmartGoal(stage: AcquisitionStage): CampaignSmartGoal {
  return defaultSmartGoalForStage(stage);
}

export function recommendSmartGoalFromOpportunity(
  opportunity: Opportunity,
  stage: AcquisitionStage,
): CampaignSmartGoal {
  const base = defaultSmartGoalForStage(stage);
  const realistic = opportunity.financialScenarios.find((s) => s.name === "Réaliste");
  if (!realistic) return base;

  if (stage === "network" || stage === "outreach") {
    return {
      ...base,
      label: `${Math.min(10, realistic.clients)} conversations qualifiées`,
      metric: "conversations",
      targetValue: Math.min(10, Math.max(3, realistic.clients)),
    };
  }
  if (stage === "content" || stage === "amplification") {
    return {
      ...base,
      label: `${Math.min(30, realistic.clients)} signups organiques`,
      metric: "signups",
      targetValue: Math.min(30, Math.max(10, realistic.clients)),
      horizonDays: 30,
    };
  }
  return base;
}

export function getDifferentiationAngles(opportunity: Opportunity): string[] {
  const angles: string[] = [];
  for (const item of opportunity.whyItWorks ?? []) {
    const fact = typeof item === "string" ? item : item.fact;
    if (fact?.trim()) angles.push(fact.trim());
  }
  for (const comp of opportunity.frenchCompetitors ?? []) {
    angles.push(`vs ${comp.name} : ${comp.weakness ?? comp.positioning}`);
  }
  if (opportunity.foreignMarketProfile?.problemSolved) {
    angles.push(opportunity.foreignMarketProfile.problemSolved);
  }
  return angles.slice(0, 5);
}

export function getCacNoteForChannel(
  opportunity: Opportunity,
  channel: ExtendedChannelKey,
): { estimate: number; note: string } | null {
  const tabTitle =
    opportunity.acquisition.find((a) => resolveExtendedChannelKey(a.title) === channel)
      ?.title ?? opportunity.acquisition[0]?.title;
  if (!tabTitle) return null;
  const cac = getCacForChannel(opportunity.cacChannels, tabTitle);
  if (!cac) return null;
  return { estimate: cac.estimate, note: cac.note };
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

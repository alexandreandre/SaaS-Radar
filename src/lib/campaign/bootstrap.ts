import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  normalizeCampaignSetup,
} from "@/lib/portfolio";
import {
  recommendChannelForStage,
  recommendIcpSummary,
  recommendSmartGoal,
  recommendStageForProject,
} from "@/lib/campaign/recommend";
import { buildWorkflowForStack } from "@/lib/campaign/workflows";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import {
  type AcquisitionStage,
  profileFromStage,
} from "@/lib/campaign/stages";
import {
  buildActionItemsForStage,
  buildTrackingPlan,
  enrichActionsFromOpportunity,
} from "@/lib/campaign/actions";
import type { CampaignSetup } from "@/lib/campaign/kits";

export type CampaignBootstrapResult = {
  project: UserProject;
  applied: boolean;
};

function initCampaignSetup(
  project: UserProject,
  opportunity: Opportunity,
  stage: AcquisitionStage,
  channel: ExtendedChannelKey,
): UserProject {
  const existingToolIds =
    project.campaignSetup?.activeToolIds ??
    project.activeCampaignToolIds ??
    [];
  const productName = project.productName ?? opportunity.name;
  const smartGoal = project.campaignSetup?.smartGoal ?? recommendSmartGoal(stage);
  const icpSummary =
    project.campaignSetup?.icpSummary ?? recommendIcpSummary(opportunity);
  const profile = profileFromStage(stage);
  const actionItems = enrichActionsFromOpportunity(
    project.campaignSetup?.actionItems?.length
      ? project.campaignSetup.actionItems
      : buildActionItemsForStage(stage, channel),
    opportunity,
    productName,
  );
  const trackingPlan =
    project.campaignSetup?.trackingPlan ??
    buildTrackingPlan(project.hostConnection?.productionUrl, stage);

  const setup: CampaignSetup = {
    acquisitionStage: stage,
    stageOverride: project.campaignSetup?.stageOverride,
    smartGoal,
    icpSummary,
    positioning: project.campaignSetup?.positioning,
    primaryChannel: channel,
    activeToolIds: existingToolIds,
    workflow: buildWorkflowForStack(channel, existingToolIds),
    strategyBrief: project.campaignSetup?.strategyBrief,
    kitsByTool: project.campaignSetup?.kitsByTool ?? {},
    actionItems,
    trackingPlan,
    weeklyCheckIns: project.campaignSetup?.weeklyCheckIns ?? [],
    retrospective: project.campaignSetup?.retrospective,
    cycleStartedAt: project.campaignSetup?.cycleStartedAt ?? new Date().toISOString(),
    cycleStatus: project.campaignSetup?.cycleStatus ?? "draft",
    profile,
    distributionAcknowledgedAt: project.campaignSetup?.distributionAcknowledgedAt,
    measureAcknowledgedAt: project.campaignSetup?.measureAcknowledgedAt,
  };

  return normalizeCampaignSetup({
    ...project,
    marketingProfile: profile,
    campaignSetup: setup,
    activeCampaignToolIds: existingToolIds,
  });
}

/**
 * Applique stade, canal, objectif et ICP recommandés si absents.
 */
export function ensureCampaignDefaults(
  project: UserProject,
  opportunity: Opportunity,
): CampaignBootstrapResult {
  let next = project;
  let applied = false;

  const stage = recommendStageForProject(next, opportunity);
  const suggestedChannel = recommendChannelForStage(opportunity, stage);
  const hasSetup = Boolean(next.campaignSetup);
  const hasChannel = Boolean(next.campaignSetup?.primaryChannel);
  const hasStage = Boolean(next.campaignSetup?.acquisitionStage);
  const hasGoal = Boolean(next.campaignSetup?.smartGoal);
  const hasIcp = Boolean(next.campaignSetup?.icpSummary?.trim());

  if (!hasSetup) {
    next = initCampaignSetup(next, opportunity, stage, suggestedChannel);
    return { project: next, applied: true };
  }

  if (!hasStage || !hasGoal || !hasIcp || !hasChannel) {
    const channel = next.campaignSetup?.primaryChannel ?? suggestedChannel;
    next = initCampaignSetup(next, opportunity, stage, channel);
    applied = true;
  }

  return { project: next, applied };
}

export function needsCampaignDefaults(project: UserProject): boolean {
  return (
    !project.campaignSetup ||
    !project.campaignSetup.primaryChannel ||
    !project.campaignSetup.acquisitionStage ||
    !project.campaignSetup.smartGoal ||
    !project.campaignSetup.icpSummary?.trim()
  );
}

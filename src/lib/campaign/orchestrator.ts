import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getCacForChannel } from "@/lib/acquisition-channels";
import { getChannelLabel, resolveExtendedChannelKey } from "@/lib/campaign/channels";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import { getStageDefinition } from "@/lib/campaign/stages";
import {
  getVisiblePlaybooks,
  resolvePlaybookLabel,
  type CampaignPlaybookId,
  type PlaybookWithRelevance,
} from "@/lib/campaign/playbooks";
import { getCampaignReadiness, type CampaignReadiness } from "@/lib/campaign/readiness";
import { getCurrentCampaignWeek } from "@/lib/campaign/week-plan";

export type CampaignBudgetHint = {
  channelLabel: string;
  estimateEur: number;
  note: string;
  weeklyTimeHint: string;
};

export type CampaignOrchestratorState = {
  currentWeek: number;
  totalWeeks: number;
  weekObjective?: string;
  focusChannel: ExtendedChannelKey;
  focusLabel: string;
  supportChannels: PlaybookWithRelevance[];
  readiness: CampaignReadiness;
  budget: CampaignBudgetHint;
  smartGoalProgress?: {
    current: number;
    target: number;
    label: string;
    pct: number;
  };
};

function getBudgetHint(
  opportunity: Opportunity,
  channel: ExtendedChannelKey,
  stage: AcquisitionStage,
): CampaignBudgetHint {
  const tabTitle =
    opportunity.acquisition.find((a) => resolveExtendedChannelKey(a.title) === channel)
      ?.title ?? getChannelLabel(channel);
  const cac = getCacForChannel(opportunity.cacChannels, tabTitle);
  const playbooks = getVisiblePlaybooks(stage, channel, opportunity);
  const primary = playbooks.find((p) => p.id === channel);

  return {
    channelLabel: getChannelLabel(channel),
    estimateEur: cac?.estimate ?? 0,
    note: cac?.note ?? "Budget indicatif depuis la fiche opportunité.",
    weeklyTimeHint: primary?.weeklyTimeHint ?? "3–5 h / semaine",
  };
}

function getSmartGoalProgress(project: UserProject): CampaignOrchestratorState["smartGoalProgress"] {
  const goal = project.campaignSetup?.smartGoal;
  if (!goal) return undefined;

  const checkIns = project.campaignSetup?.weeklyCheckIns ?? [];
  const latest = checkIns[checkIns.length - 1];
  const current = latest?.metricValue ?? 0;
  const target = goal.targetValue;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return {
    current,
    target,
    label: goal.label,
    pct,
  };
}

export function getCampaignOrchestratorState(
  project: UserProject,
  opportunity: Opportunity,
  stage: AcquisitionStage,
  primaryChannel: ExtendedChannelKey,
): CampaignOrchestratorState {
  const weekInfo = getCurrentCampaignWeek(project, opportunity);
  const playbooks = getVisiblePlaybooks(stage, primaryChannel, opportunity);
  const focus = playbooks.find((p) => p.relevance === "primary") ?? playbooks[0];
  const supportChannels = playbooks.filter(
    (p) => p.relevance === "recommended" && p.id !== focus?.id,
  ).slice(0, 2);

  return {
    currentWeek: weekInfo.week,
    totalWeeks: weekInfo.totalWeeks,
    weekObjective: weekInfo.objective,
    focusChannel: primaryChannel,
    focusLabel: focus ? resolvePlaybookLabel(focus.id as CampaignPlaybookId) : getChannelLabel(primaryChannel),
    supportChannels,
    readiness: getCampaignReadiness(project, opportunity),
    budget: getBudgetHint(opportunity, primaryChannel, stage),
    smartGoalProgress: getSmartGoalProgress(project),
  };
}

export function getStageCoachSummary(stage: AcquisitionStage): string {
  const def = getStageDefinition(stage);
  return `${def.label} · ${def.customerRange} · ${def.primaryMetric}`;
}

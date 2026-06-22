import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CampaignActionItem } from "@/lib/campaign/stages";
import { getCurrentWeek } from "@/lib/build-launch";

export type CampaignWeekTask = {
  id: string;
  label: string;
  source: "timeline" | "action" | "tactic";
  done: boolean;
  phase?: CampaignActionItem["phase"];
  actionId?: string;
};

export type CampaignWeekPlan = {
  week: number;
  totalWeeks: number;
  title: string;
  objective?: string;
  tasks: CampaignWeekTask[];
  executeActions: CampaignActionItem[];
};

function weeksFromTimeline(opportunity: Opportunity): number {
  return Math.max(1, opportunity.launchTimeline?.length ?? 4);
}

function weekFromCycle(project: UserProject, totalWeeks: number): number {
  const started = project.campaignSetup?.cycleStartedAt ?? project.startedAt;
  const start = new Date(started);
  const now = new Date();
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.min(totalWeeks, Math.floor(days / 7) + 1);
}

export function getCurrentCampaignWeek(
  project: UserProject,
  opportunity: Opportunity,
): { week: number; totalWeeks: number; objective?: string; title: string } {
  const totalWeeks = weeksFromTimeline(opportunity);
  const launchWeek =
    opportunity.mvpPlan?.roadmap?.length
      ? getCurrentWeek(project, opportunity)
      : weekFromCycle(project, totalWeeks);
  const cycleWeek = weekFromCycle(project, totalWeeks);
  const week = Math.max(launchWeek, cycleWeek);
  const timelineWeek = opportunity.launchTimeline?.find((w) => w.week === week);

  return {
    week,
    totalWeeks,
    objective: timelineWeek?.goal,
    title: timelineWeek ? `Semaine ${week} — ${timelineWeek.kpi}` : `Semaine ${week}`,
  };
}

export function buildCampaignWeekPlan(
  project: UserProject,
  opportunity: Opportunity,
): CampaignWeekPlan {
  const { week, totalWeeks, objective, title } = getCurrentCampaignWeek(project, opportunity);
  const timelineWeek = opportunity.launchTimeline?.find((w) => w.week === week);
  const actionItems = project.campaignSetup?.actionItems ?? [];

  const timelineTasks: CampaignWeekTask[] = (timelineWeek?.actions ?? []).map((task, i) => ({
    id: `timeline-${week}-${i}`,
    label: task,
    source: "timeline" as const,
    done: false,
  }));

  const executeActions = actionItems.filter((a) => a.phase === "execute");
  const actionTasks: CampaignWeekTask[] = executeActions.map((a) => ({
    id: `action-${a.id}`,
    label: a.label,
    source: "action" as const,
    done: a.done,
    phase: a.phase,
    actionId: a.id,
  }));

  const primaryChannel = project.campaignSetup?.primaryChannel;
  const tacticTasks: CampaignWeekTask[] = [];
  if (primaryChannel) {
    const tab = opportunity.acquisition.find(
      (a) => a.title.toLowerCase().includes(primaryChannel.replace("_", " ")) ||
        resolveChannelTitle(a.title) === primaryChannel,
    ) ?? opportunity.acquisition[0];

    (tab?.tactics ?? []).slice(0, 3).forEach((tactic, i) => {
      tacticTasks.push({
        id: `tactic-${week}-${i}`,
        label: tactic,
        source: "tactic",
        done: false,
      });
    });
  }

  const tasks = [...timelineTasks, ...actionTasks, ...tacticTasks];

  return {
    week,
    totalWeeks,
    title,
    objective,
    tasks,
    executeActions,
  };
}

function resolveChannelTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("seo") || lower.includes("blog")) return "seo";
  if (lower.includes("email") || lower.includes("cold")) return "cold_email";
  if (lower.includes("referral")) return "referral";
  if (lower.includes("meta") || lower.includes("facebook")) return "meta";
  if (lower.includes("google")) return "google";
  if (lower.includes("tiktok")) return "tiktok";
  return lower;
}

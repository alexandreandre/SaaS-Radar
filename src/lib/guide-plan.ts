import type { MvpPlan, Opportunity } from "@/types/opportunity";
import type { TargetScenario, UserProject } from "@/lib/portfolio";
import {
  getCurrentWeek,
  getLaunchMilestones,
  getLaunchWeekPreview,
} from "@/lib/build-launch";

export function parseDayRange(dayLabel: string): { start: number; end: number } {
  const match = dayLabel.match(/J(\d+)(?:-(\d+))?/i);
  if (!match) return { start: 1, end: 14 };
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : start;
  return { start, end };
}

export function getPlanDurationDays(roadmap: MvpPlan["roadmap"]): number {
  if (roadmap.length === 0) return 14;
  const last = roadmap[roadmap.length - 1];
  return parseDayRange(last.day).end;
}

export function getPlanDayRangeLabel(roadmap: MvpPlan["roadmap"]): string {
  if (roadmap.length === 0) return "J1 → J14";
  const first = parseDayRange(roadmap[0].day).start;
  const last = getPlanDurationDays(roadmap);
  return `J${first} → J${last}`;
}

export function getDaysSinceStarted(startedAt: string): number {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

export function getCurrentPlanDay(project: UserProject, opportunity: Opportunity): number {
  const duration = getPlanDurationDays(opportunity.mvpPlan.roadmap);
  return Math.min(getDaysSinceStarted(project.startedAt), duration);
}

export function getTargetClients(
  opportunity: Opportunity,
  targetScenario: TargetScenario = "Réaliste",
): number {
  const scenario = opportunity.financialScenarios.find((s) => s.name === targetScenario);
  return scenario?.clients ?? 5;
}

export function getGuideMilestoneProgress(project: UserProject): {
  done: number;
  total: number;
} {
  const launch = getLaunchMilestones(project);
  return {
    done: launch.filter((m) => m.done).length,
    total: launch.length,
  };
}

export function inferWeekFromStepIndex(index: number, totalSteps: number): number {
  if (totalSteps <= 0) return 1;
  return Math.min(4, Math.floor((index / totalSteps) * 4) + 1);
}

export function getStepWeek(
  step: MvpPlan["roadmap"][number],
  index: number,
  totalSteps: number,
): number {
  return step.week ?? inferWeekFromStepIndex(index, totalSteps);
}

export function getCurrentRoadmapStepIndex(
  project: UserProject,
  opportunity: Opportunity,
): number {
  const roadmap = opportunity.mvpPlan.roadmap;
  if (roadmap.length === 0) return 0;

  const currentWeek = getCurrentWeek(project, opportunity);
  const match = roadmap.findIndex(
    (step, i) => getStepWeek(step, i, roadmap.length) === currentWeek,
  );
  if (match >= 0) return match;

  return Math.min(
    roadmap.length - 1,
    Math.floor(((currentWeek - 1) / 4) * roadmap.length),
  );
}

export function getGuideHeaderSubtitle(
  project: UserProject,
  opportunity: Opportunity,
): string {
  const currentWeek = getCurrentWeek(project, opportunity);
  const weekData =
    opportunity.launchTimeline?.find((w) => w.week === currentWeek) ??
    getLaunchWeekPreview(opportunity);
  const stepIndex = getCurrentRoadmapStepIndex(project, opportunity);
  const step = opportunity.mvpPlan.roadmap[stepIndex];
  if (step) {
    return `Semaine ${currentWeek} · ${step.day} — ${weekData.goal}`;
  }
  return `Semaine ${currentWeek} · ${weekData.goal}`;
}

import type { Opportunity } from "@/types/opportunity";
import type { Milestone, TargetScenario, UserProject } from "@/lib/portfolio";
import {
  getActiveBuildMilestones,
  getBuildStepMilestoneId,
  getStepIndexFromMilestoneId,
} from "@/lib/build-recipe";
import { getStepWeek } from "@/lib/guide-plan";

export type BuilderStage = "starting" | "building" | "has_mrr";

export const ONBOARDING_MILESTONE_TARGET = 3;

export function getFirstLaunchAction(opportunity: Opportunity): string {
  const week = opportunity.launchTimeline?.[0];
  if (week?.actions[0]) return week.actions[0];
  return "Créez votre landing et contactez 10 prospects cette semaine.";
}

export function getFirstLaunchMilestoneId(opportunity: Opportunity): string | null {
  const week = opportunity.launchTimeline?.[0];
  if (!week) return null;
  return `launch-w${week.week}-0`;
}

export function getLaunchWeekPreview(opportunity: Opportunity) {
  const week = opportunity.launchTimeline?.[0];
  if (!week) {
    return {
      week: 1,
      goal: "Valider le problème",
      actions: [getFirstLaunchAction(opportunity)],
      kpi: "Première action complétée",
    };
  }
  return week;
}

export function getQuickLaunchDefaults(
  stage: BuilderStage,
  options?: { startedAt?: string; currentMrr?: number }
): {
  startedAt: string;
  currentMrr: number;
  targetScenario: TargetScenario;
  builderStage: BuilderStage;
} {
  const today = new Date().toISOString().slice(0, 10);
  if (stage === "has_mrr") {
    return {
      startedAt: options?.startedAt ?? today,
      currentMrr: options?.currentMrr ?? 0,
      targetScenario: "Réaliste",
      builderStage: stage,
    };
  }
  if (stage === "building") {
    return {
      startedAt: options?.startedAt ?? today,
      currentMrr: 0,
      targetScenario: "Réaliste",
      builderStage: stage,
    };
  }
  return {
    startedAt: today,
    currentMrr: 0,
    targetScenario: "Réaliste",
    builderStage: "starting",
  };
}

export function shouldShowLaunchPad(project: UserProject): boolean {
  return project.onboardingCompleted !== true;
}

/** @deprecated Use shouldShowLaunchPad */
export function shouldShowFocusMode(project: UserProject): boolean {
  return shouldShowLaunchPad(project);
}

export function getOnboardingProgress(project: UserProject): {
  done: number;
  target: number;
  percent: number;
} {
  const done = project.milestones.filter((m) => m.done).length;
  const target = ONBOARDING_MILESTONE_TARGET;
  return {
    done: Math.min(done, target),
    target,
    percent: Math.min(100, Math.round((done / target) * 100)),
  };
}

export function isOnboardingComplete(project: UserProject): boolean {
  return getOnboardingProgress(project).done >= ONBOARDING_MILESTONE_TARGET;
}

export function getMvpStackPreview(opportunity: Opportunity, limit = 3): string[] {
  return opportunity.mvpPlan.stack.slice(0, limit);
}

export function getLaunchTeaser(opportunity: Opportunity): string {
  const week = getLaunchWeekPreview(opportunity);
  const count = week.actions.length;
  return `Semaine ${week.week} · ${count} action${count > 1 ? "s" : ""} prête${count > 1 ? "s" : ""}`;
}

export function getLaunchMilestones(project: UserProject): Milestone[] {
  const buildSteps = getActiveBuildMilestones(project);
  if (buildSteps.length > 0) return buildSteps;
  return project.milestones.filter((m) => m.source === "launch");
}

export function getWeekFromMilestoneId(
  milestoneId: string,
  opportunity?: Opportunity,
): number | null {
  const buildIndex = getStepIndexFromMilestoneId(milestoneId);
  if (buildIndex !== null && opportunity) {
    const step = opportunity.mvpPlan.roadmap[buildIndex];
    if (step) {
      return getStepWeek(step, buildIndex, opportunity.mvpPlan.roadmap.length);
    }
  }

  const match = milestoneId.match(/^launch-w(\d+)-/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function getCurrentWeek(project: UserProject, opportunity: Opportunity): number {
  const roadmap = opportunity.mvpPlan.roadmap;
  const launchMilestones = getLaunchMilestones(project);

  if (roadmap.length > 0 && launchMilestones.some((m) => m.id.startsWith("build-step-"))) {
    for (let i = 0; i < roadmap.length; i++) {
      const milestoneId = getBuildStepMilestoneId(i);
      const milestone = launchMilestones.find((m) => m.id === milestoneId);
      if (!milestone?.done) {
        return getStepWeek(roadmap[i], i, roadmap.length);
      }
    }
    const last = roadmap[roadmap.length - 1];
    return getStepWeek(last, roadmap.length - 1, roadmap.length);
  }

  const weeks = opportunity.launchTimeline ?? [];
  if (weeks.length === 0) return 1;

  for (const week of weeks) {
    const weekItems = launchMilestones.filter((m) => m.id.startsWith(`launch-w${week.week}-`));
    if (weekItems.length === 0) continue;
    const allDone = weekItems.every((m) => m.done);
    if (!allDone) return week.week;
  }

  return weeks[weeks.length - 1]?.week ?? 1;
}

export function getNextMilestone(
  project: UserProject,
  opportunity: Opportunity
): Milestone | null {
  const currentWeek = getCurrentWeek(project, opportunity);
  const launchMilestones = getLaunchMilestones(project);

  const currentWeekItems = launchMilestones.filter(
    (m) => getWeekFromMilestoneId(m.id, opportunity) === currentWeek,
  );
  const nextInWeek = currentWeekItems.find((m) => !m.done);
  if (nextInWeek) return nextInWeek;

  return launchMilestones.find((m) => !m.done) ?? null;
}

export function getWeekMilestones(
  project: UserProject,
  weekNumber: number,
  opportunity: Opportunity,
): Milestone[] {
  return getLaunchMilestones(project).filter(
    (m) => getWeekFromMilestoneId(m.id, opportunity) === weekNumber,
  );
}

export function shouldShowRevenueMilestones(
  project: UserProject,
  opportunity: Opportunity
): boolean {
  if (project.builderStage === "has_mrr") return true;
  return getCurrentWeek(project, opportunity) >= 3;
}

export type LaunchPadView = {
  currentWeek: number;
  weekGoal: string;
  weekKpi: string;
  nextMilestone: Milestone | null;
  progress: ReturnType<typeof getOnboardingProgress>;
  showRevenue: boolean;
  stack: string[];
  remainingThisWeek: number;
};

export function getLaunchPadView(
  project: UserProject,
  opportunity: Opportunity
): LaunchPadView {
  const currentWeek = getCurrentWeek(project, opportunity);
  const weekData =
    opportunity.launchTimeline?.find((w) => w.week === currentWeek) ??
    getLaunchWeekPreview(opportunity);
  const nextMilestone = getNextMilestone(project, opportunity);
  const currentWeekItems = getWeekMilestones(project, currentWeek, opportunity);
  const remainingThisWeek = currentWeekItems.filter((m) => !m.done).length;

  return {
    currentWeek,
    weekGoal: weekData.goal,
    weekKpi: weekData.kpi,
    nextMilestone,
    progress: getOnboardingProgress(project),
    showRevenue: shouldShowRevenueMilestones(project, opportunity),
    stack: getMvpStackPreview(opportunity),
    remainingThisWeek: nextMilestone ? Math.max(0, remainingThisWeek - 1) : remainingThisWeek,
  };
}

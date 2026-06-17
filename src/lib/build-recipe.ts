import type { BuildPrompts, Opportunity, RoadmapStep } from "@/types/opportunity";
import type { Milestone, UserProject } from "@/lib/portfolio";
import {
  getCurrentPlanDay,
  getCurrentRoadmapStepIndex,
  getPlanDurationDays,
  getStepWeek,
  getTargetClients,
} from "@/lib/guide-plan";
import { getLaunchMilestones } from "@/lib/build-launch";

export const BUILD_STEP_PREFIX = "build-step-";

export function getBuildStepMilestoneId(stepIndex: number): string {
  return `${BUILD_STEP_PREFIX}${stepIndex}`;
}

export function getStepIndexFromMilestoneId(milestoneId: string): number | null {
  if (!milestoneId.startsWith(BUILD_STEP_PREFIX)) return null;
  const index = parseInt(milestoneId.slice(BUILD_STEP_PREFIX.length), 10);
  return Number.isNaN(index) ? null : index;
}

export function getRoadmapStepLabel(step: RoadmapStep, index: number): string {
  const headline = step.objective ?? step.tasks[0] ?? `Étape ${index + 1}`;
  return `${step.day} — ${headline}`;
}

export function getBuildMilestones(project: UserProject): Milestone[] {
  return project.milestones.filter(
    (m) => m.source === "launch" && m.id.startsWith(BUILD_STEP_PREFIX),
  );
}

export function getLegacyLaunchMilestones(project: UserProject): Milestone[] {
  return project.milestones.filter(
    (m) => m.source === "launch" && m.id.startsWith("launch-w"),
  );
}

export function getActiveBuildMilestones(project: UserProject): Milestone[] {
  const build = getBuildMilestones(project);
  if (build.length > 0) return build;
  return getLegacyLaunchMilestones(project);
}

export function isBuildStepDone(project: UserProject, stepIndex: number): boolean {
  const id = getBuildStepMilestoneId(stepIndex);
  return project.milestones.some((m) => m.id === id && m.done);
}

export function getRoadmapProgress(project: UserProject, opportunity: Opportunity) {
  const roadmap = opportunity.mvpPlan.roadmap;
  const total = roadmap.length;
  const buildMilestones = getActiveBuildMilestones(project);
  const done = buildMilestones.filter((m) => m.done).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}

export function getCurrentBuildStepIndex(
  project: UserProject,
  opportunity: Opportunity,
): number {
  const roadmap = opportunity.mvpPlan.roadmap;
  if (roadmap.length === 0) return 0;

  for (let i = 0; i < roadmap.length; i++) {
    if (!isBuildStepDone(project, i)) return i;
  }

  return roadmap.length - 1;
}

export function getCurrentBuildStep(
  project: UserProject,
  opportunity: Opportunity,
): { step: RoadmapStep; index: number } | null {
  const roadmap = opportunity.mvpPlan.roadmap;
  if (roadmap.length === 0) return null;
  const index = getCurrentBuildStepIndex(project, opportunity);
  return { step: roadmap[index], index };
}

export function getStepPrompt(step: RoadmapStep, opportunity: Opportunity): string {
  if (step.buildPrompt) return step.buildPrompt;
  const kit = resolveBuildPrompts(opportunity);
  if (kit?.scaffold) return kit.scaffold;
  return opportunity.claudePrompt;
}

export function resolveBuildPrompts(opportunity: Opportunity): BuildPrompts | null {
  if (opportunity.buildPrompts) return opportunity.buildPrompts;
  if (!opportunity.claudePrompt) return null;
  return {
    scaffold: opportunity.claudePrompt,
    features: opportunity.mvpPlan.features.map((feature) => ({
      feature,
      prompt: `Implement the "${feature}" feature for ${opportunity.name}.\n\nContext:\n${opportunity.claudePrompt.split("\n").slice(0, 12).join("\n")}`,
    })),
  };
}

export function getPlanPaceStatus(project: UserProject, opportunity: Opportunity) {
  const duration = getPlanDurationDays(opportunity.mvpPlan.roadmap);
  const currentDay = getCurrentPlanDay(project, opportunity);
  const { done, total } = getRoadmapProgress(project, opportunity);
  const expectedDone = total > 0 ? Math.floor((currentDay / duration) * total) : 0;
  const delta = done - expectedDone;

  if (delta >= 1) return { label: "En avance", tone: "ahead" as const, delta };
  if (delta <= -1) return { label: "En retard", tone: "behind" as const, delta };
  return { label: "Dans les temps", tone: "on_track" as const, delta };
}

export type BuildHeroView = {
  step: RoadmapStep;
  stepIndex: number;
  prompt: string;
  currentPlanDay: number;
  planDuration: number;
  targetClients: number;
  progress: ReturnType<typeof getRoadmapProgress>;
  pace: ReturnType<typeof getPlanPaceStatus>;
  allDone: boolean;
};

export function getBuildHeroView(
  project: UserProject,
  opportunity: Opportunity,
): BuildHeroView | null {
  const roadmap = opportunity.mvpPlan.roadmap;
  if (roadmap.length === 0) return null;

  const stepIndex = getCurrentRoadmapStepIndex(project, opportunity);
  const buildIndex = getCurrentBuildStepIndex(project, opportunity);
  const activeIndex = getActiveBuildMilestones(project).length > 0 ? buildIndex : stepIndex;
  const step = roadmap[activeIndex] ?? roadmap[roadmap.length - 1];
  const progress = getRoadmapProgress(project, opportunity);

  return {
    step,
    stepIndex: activeIndex,
    prompt: getStepPrompt(step, opportunity),
    currentPlanDay: getCurrentPlanDay(project, opportunity),
    planDuration: getPlanDurationDays(opportunity.mvpPlan.roadmap),
    targetClients: getTargetClients(opportunity, project.targetScenario),
    progress,
    pace: getPlanPaceStatus(project, opportunity),
    allDone: progress.done >= progress.total && progress.total > 0,
  };
}

export function getWeekForRoadmapStep(
  step: RoadmapStep,
  index: number,
  totalSteps: number,
): number {
  return getStepWeek(step, index, totalSteps);
}

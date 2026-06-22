/**
 * Tests unitaires orchestrateur et readiness campagne.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { getCampaignOrchestratorState } from "../src/lib/campaign/orchestrator";
import { getCampaignReadiness } from "../src/lib/campaign/readiness";
import { buildCampaignWeekPlan } from "../src/lib/campaign/week-plan";
import type { UserProject } from "../src/lib/portfolio";
import type { Opportunity } from "../src/types/opportunity";
import { defaultSmartGoalForStage } from "../src/lib/campaign/stages";

function baseProject(overrides: Partial<UserProject> = {}): UserProject {
  return {
    id: "p1",
    opportunitySlug: "test",
    startedAt: "2025-01-01",
    phase: "launch",
    currentMrr: 0,
    mrrHistory: [],
    targetScenario: "Réaliste",
    milestones: [],
    checkInStreak: 0,
    createdAt: "2025-01-01",
    hostConnection: { productionUrl: "https://app.test", provider: "vercel" },
    ...overrides,
  };
}

const opportunity = {
  acquisition: [{ id: "1", title: "LinkedIn", tactics: ["Poster 2x/semaine"] }],
  cacChannels: [{ channel: "LinkedIn", estimate: 80, note: "Organique d'abord" }],
  financialScenarios: [
    { name: "Réaliste", clients: 10, avgPrice: 49, mrr: 490, grossMargin: 80 },
  ],
  launchTimeline: [
    { week: 1, goal: "Premiers contacts", actions: ["10 DMs"], kpi: "Conversations" },
  ],
  targetClient: "PME",
  pitch: "Test",
} as Opportunity;

test("readiness — score partiel sans stratégie", () => {
  const readiness = getCampaignReadiness(baseProject());
  assert.equal(readiness.strategyComplete, false);
  assert.ok(readiness.score < 100);
  assert.ok(readiness.blockers.length > 0);
});

test("orchestrator — focus canal et budget", () => {
  const state = getCampaignOrchestratorState(
    baseProject({
      campaignSetup: {
        acquisitionStage: "network",
        primaryChannel: "linkedin",
        activeToolIds: [],
        workflow: [],
        kitsByTool: {},
        actionItems: [],
        weeklyCheckIns: [],
        cycleStatus: "draft",
        smartGoal: defaultSmartGoalForStage("network"),
        icpSummary: "PME France",
      },
    }),
    opportunity,
    "network",
    "linkedin",
  );
  assert.equal(state.focusChannel, "linkedin");
  assert.equal(state.budget.estimateEur, 80);
  assert.ok(state.currentWeek >= 1);
});

test("week plan — inclut tactiques fiche", () => {
  const plan = buildCampaignWeekPlan(
    baseProject({
      campaignSetup: {
        acquisitionStage: "network",
        primaryChannel: "linkedin",
        activeToolIds: [],
        workflow: [],
        kitsByTool: {},
        actionItems: [],
        weeklyCheckIns: [],
        cycleStatus: "draft",
      },
    }),
    opportunity,
  );
  assert.ok(plan.tasks.some((t) => t.source === "tactic" || t.source === "timeline"));
});

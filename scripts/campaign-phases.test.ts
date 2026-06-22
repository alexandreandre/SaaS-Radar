/**
 * Tests unitaires du modèle 4 phases campagne.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  getCompletedPhaseCount,
  getFoundationsGaps,
  getNextCampaignAction,
  getPhaseCompletionStatus,
  isFoundationsComplete,
  mapReadinessBlockerToAnchor,
  resolveCampaignPhase,
} from "../src/lib/campaign/phases";
import { getCampaignAssetChecklist } from "../src/lib/campaign/assets";
import type { UserProject } from "../src/lib/portfolio";
import { defaultSmartGoalForStage } from "../src/lib/campaign/stages";

function baseProject(overrides: Partial<UserProject> = {}): UserProject {
  return {
    id: "p1",
    opportunitySlug: "quote-generator-contractors",
    startedAt: "2025-01-01",
    phase: "launch",
    currentMrr: 0,
    mrrHistory: [],
    targetScenario: "Réaliste",
    milestones: [],
    checkInStreak: 0,
    createdAt: "2025-01-01",
    ...overrides,
  };
}

function baseSetup(overrides: Partial<NonNullable<UserProject["campaignSetup"]>> = {}) {
  return {
    acquisitionStage: "network" as const,
    primaryChannel: "linkedin" as const,
    activeToolIds: [] as const,
    workflow: [],
    kitsByTool: {},
    actionItems: [],
    weeklyCheckIns: [],
    cycleStatus: "draft" as const,
    profile: "organic" as const,
    smartGoal: defaultSmartGoalForStage("network"),
    icpSummary: "PME BTP en France",
    strategyBrief: "Brief complet",
    ...overrides,
  };
}

test("getFoundationsGaps — intro sans démarrage", () => {
  const gaps = getFoundationsGaps(
    baseProject({
      campaignSetup: baseSetup({
        smartGoal: undefined,
        icpSummary: undefined,
        strategyBrief: undefined,
        positioning: undefined,
      }),
    }),
  );
  assert.ok(gaps.some((g) => g.id === "intro"));
});

test("resolveCampaignPhase — fondations incomplètes", () => {
  const project = baseProject({
    campaignSetup: baseSetup({ strategyBrief: undefined, positioning: undefined }),
  });
  assert.equal(resolveCampaignPhase(project, "network"), "foundations");
});

test("getNextCampaignAction — pointe vers audience si démarré", () => {
  const project = baseProject({
    campaignSetup: baseSetup({
      foundationsRiver: { startedAt: "2025-01-01" },
    }),
  });
  const action = getNextCampaignAction(project, "network");
  assert.equal(action.phase, "foundations");
  assert.equal(action.anchorId, "foundations-audience");
});

test("getPhaseCompletionStatus — phase courante", () => {
  const project = baseProject({
    campaignSetup: baseSetup({ strategyBrief: undefined, positioning: undefined }),
  });
  assert.equal(getPhaseCompletionStatus(project, "foundations", "network"), "current");
  assert.equal(getPhaseCompletionStatus(project, "creation", "network"), "locked");
});

test("mapReadinessBlockerToAnchor — tracking", () => {
  assert.equal(
    mapReadinessBlockerToAnchor("UTM, analytics ou question attribution"),
    "infra-gates",
  );
});

test("getCampaignAssetChecklist — canal linkedin", () => {
  const items = getCampaignAssetChecklist("linkedin");
  assert.ok(items.some((i) => i.label.includes("LinkedIn")));
  assert.ok(items.length >= 4);
});

test("isFoundationsComplete — brief ou positioning", () => {
  assert.equal(
    isFoundationsComplete(
      baseSetup({ strategyBrief: "x", positioning: undefined }),
    ),
    true,
  );
});

test("getCompletedPhaseCount — fondations complètes", () => {
  const project = baseProject({ campaignSetup: baseSetup() });
  assert.equal(getCompletedPhaseCount(project), 1);
});

/**
 * Tests unitaires du parcours campagne (5 étapes).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { getCampaignJourneyState } from "../src/lib/campaign/journey";
import { removeCampaignTool } from "../src/lib/portfolio";
import type { UserProject } from "../src/lib/portfolio";
import type { Opportunity } from "../src/types/opportunity";
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
    ...overrides,
  };
}

const minimalOpportunity = {
  acquisition: [{ id: "1", title: "LinkedIn", tactics: ["Poster"] }],
  cacChannels: [{ channel: "LinkedIn", estimate: 80, note: "test" }],
  targetClient: "Artisans BTP",
  pitch: "Devis rapides",
  sector: "construction",
} as Opportunity;

test("étape 1 — sans objectif complet", () => {
  const state = getCampaignJourneyState(
    baseProject({
      campaignSetup: baseSetup({ smartGoal: undefined, icpSummary: undefined }),
    }),
    minimalOpportunity,
  );
  assert.equal(state.currentStep, 1);
  assert.equal(state.displayPhase, "strategy");
});

test("étape 2 — cible OK sans message", () => {
  const state = getCampaignJourneyState(
    baseProject({
      campaignSetup: baseSetup({ strategyBrief: undefined, positioning: undefined }),
    }),
    minimalOpportunity,
  );
  assert.equal(state.currentStep, 2);
});

test("étape 3 — message OK sans kit ni prepare", () => {
  const state = getCampaignJourneyState(
    baseProject({
      campaignSetup: baseSetup({
        strategyBrief: "Brief stratégie complet",
        actionItems: [{ id: "a1", phase: "prepare", label: "x", done: false }],
      }),
    }),
    minimalOpportunity,
  );
  assert.equal(state.currentStep, 3);
  assert.equal(state.displayPhase, "preparing");
});

test("étape 4 — kit généré", () => {
  const state = getCampaignJourneyState(
    baseProject({
      campaignSetup: baseSetup({
        strategyBrief: "Brief",
        activeToolIds: ["claude"],
        kitsByTool: {
          claude: {
            toolId: "claude",
            channelKey: "linkedin",
            profile: "organic",
            brief: "b",
            primaryPrompt: "prompt ".repeat(20),
            generatedAt: "2025-01-01",
          },
        },
      }),
    }),
    minimalOpportunity,
  );
  assert.equal(state.currentStep, 4);
});

test("étape 5 — action exécutée cochée", () => {
  const state = getCampaignJourneyState(
    baseProject({
      campaignSetup: baseSetup({
        strategyBrief: "Brief",
        actionItems: [
          { id: "e1", phase: "execute", label: "DM", done: true, doneAt: "2025-01-02" },
        ],
        kitsByTool: {
          claude: {
            toolId: "claude",
            channelKey: "linkedin",
            profile: "organic",
            brief: "b",
            primaryPrompt: "prompt",
            generatedAt: "2025-01-01",
          },
        },
      }),
    }),
    minimalOpportunity,
  );
  assert.equal(state.currentStep, 5);
  assert.equal(state.displayPhase, "tracking");
});

test("iterating — cycle completed", () => {
  const state = getCampaignJourneyState(
    baseProject({
      campaignSetup: baseSetup({
        cycleStatus: "completed",
        retrospective: {
          worked: "a",
          blocked: "b",
          nextChange: "c",
          completedAt: "2025-01-03",
        },
      }),
    }),
    minimalOpportunity,
  );
  assert.equal(state.displayPhase, "iterating");
});

test("warning si app pas en ligne", () => {
  const state = getCampaignJourneyState(baseProject(), minimalOpportunity);
  assert.ok(state.appOnlineWarning);
});

test("removeCampaignTool retire outil", () => {
  const project = baseProject({
    campaignSetup: baseSetup({
      activeToolIds: ["claude", "canva"],
      strategyBrief: "Brief",
      kitsByTool: {
        claude: {
          toolId: "claude",
          channelKey: "linkedin",
          profile: "organic",
          brief: "b",
          primaryPrompt: "prompt",
          generatedAt: "2025-01-01",
        },
      },
    }),
    activeCampaignToolIds: ["claude", "canva"],
  });
  const next = removeCampaignTool(project, "canva");
  assert.deepEqual(next.campaignSetup?.activeToolIds, ["claude"]);
});

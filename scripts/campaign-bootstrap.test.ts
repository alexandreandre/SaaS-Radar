/**
 * Tests bootstrap campagne stade-aware.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { ensureCampaignDefaults, needsCampaignDefaults } from "../src/lib/campaign/bootstrap";
import type { UserProject } from "../src/lib/portfolio";
import type { Opportunity } from "../src/types/opportunity";

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

const minimalOpportunity = {
  acquisition: [{ id: "1", title: "LinkedIn", tactics: ["Poster"] }],
  cacChannels: [{ channel: "LinkedIn", estimate: 80, note: "test" }],
  targetClient: "Artisans",
  pitch: "Devis",
  sector: "construction",
} as Opportunity;

test("needsCampaignDefaults — projet vierge", () => {
  assert.equal(needsCampaignDefaults(baseProject()), true);
});

test("ensureCampaignDefaults — initialise stade, canal, goal, icp", () => {
  const { project, applied } = ensureCampaignDefaults(baseProject(), minimalOpportunity);
  assert.equal(applied, true);
  assert.equal(project.campaignSetup?.primaryChannel, "linkedin");
  assert.equal(project.campaignSetup?.acquisitionStage, "network");
  assert.ok(project.campaignSetup?.smartGoal);
  assert.ok(project.campaignSetup?.icpSummary?.includes("Artisans"));
  assert.ok(project.campaignSetup?.actionItems.length > 0);
});

test("ensureCampaignDefaults — idempotent si complet", () => {
  const existing = baseProject({
    campaignSetup: {
      acquisitionStage: "network",
      primaryChannel: "linkedin",
      activeToolIds: [],
      workflow: [],
      kitsByTool: {},
      actionItems: [],
      weeklyCheckIns: [],
      cycleStatus: "draft",
      profile: "organic",
      smartGoal: {
        label: "10 conversations",
        metric: "conversations",
        targetValue: 10,
        horizonDays: 14,
        setAt: "2025-01-01",
      },
      icpSummary: "ICP test",
    },
  });
  const { applied } = ensureCampaignDefaults(existing, minimalOpportunity);
  assert.equal(applied, false);
});

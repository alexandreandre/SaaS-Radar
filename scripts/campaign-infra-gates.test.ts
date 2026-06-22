/**
 * Tests infra gates campagne.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { canAccessDiffusionPhase, getDiffusionBlockers } from "../src/lib/campaign/infra-gates";
import type { UserProject } from "../src/lib/portfolio";

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

test("diffusion blocked without tracking", () => {
  const p = baseProject({
    campaignSetup: {
      acquisitionStage: "outreach",
      primaryChannel: "cold_email",
      activeToolIds: [],
      workflow: [],
      kitsByTool: { claude: { toolId: "claude", channelKey: "cold_email", profile: "organic", brief: "", primaryPrompt: "x", generatedAt: "2025-01-01" } },
      actionItems: [],
      weeklyCheckIns: [],
      cycleStatus: "active",
      schemaVersion: 2,
      infraGates: { crm_or_tracker: true, email_auth: true, creative_ready: true },
    },
  });
  assert.equal(canAccessDiffusionPhase(p, "outbound"), false);
  assert.ok(getDiffusionBlockers(p, "outbound").length > 0);
});

test("diffusion allowed with attribution question", () => {
  const p = baseProject({
    campaignSetup: {
      acquisitionStage: "outreach",
      primaryChannel: "cold_email",
      activeToolIds: [],
      workflow: [],
      kitsByTool: { claude: { toolId: "claude", channelKey: "cold_email", profile: "organic", brief: "", primaryPrompt: "x", generatedAt: "2025-01-01" } },
      actionItems: [],
      weeklyCheckIns: [],
      cycleStatus: "active",
      schemaVersion: 2,
      attributionQuestionEnabled: true,
      infraGates: { crm_or_tracker: true, email_auth: true, creative_ready: true },
    },
  });
  assert.equal(canAccessDiffusionPhase(p, "outbound"), true);
});

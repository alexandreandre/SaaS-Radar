/**
 * Migration campagne v2
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateProjectCampaignV2 } from "../src/lib/campaign/migrate-v2";
import type { UserProject } from "../src/lib/portfolio";

test("migrate v2 schema", () => {
  const p: UserProject = {
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
  };
  const next = migrateProjectCampaignV2(p);
  assert.equal(next.campaignSetup?.schemaVersion, 2);
  assert.ok(next.campaignSetup?.activeSequenceId);
});

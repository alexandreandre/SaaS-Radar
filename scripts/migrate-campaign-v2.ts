/**
 * Migration Campagne schema v1 → v2 (CLI / tests).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateProjectCampaignV2 } from "../src/lib/campaign/migrate-v2";
import type { UserProject } from "../src/lib/portfolio";

function legacyProject(): UserProject {
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
    launchChecklistDone: [100, 101],
    campaignSetup: {
      acquisitionStage: "outreach",
      primaryChannel: "cold_email",
      activeToolIds: [],
      workflow: [],
      kitsByTool: {},
      actionItems: [{ id: "a1", phase: "execute", label: "test", done: true }],
      weeklyCheckIns: [],
      cycleStatus: "active",
      icpSummary: "PME France",
    },
  };
}

test("migrate v2 — sets schemaVersion and sequence", () => {
  const next = migrateProjectCampaignV2(legacyProject());
  assert.equal(next.campaignSetup?.schemaVersion, 2);
  assert.ok(next.campaignSetup?.activeSequenceId);
  assert.equal(next.campaignSetup?.activeSequenceId, "cold_email_21d");
  assert.ok(next.campaignSetup?.assetChecklist?.some(Boolean));
});

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = migrateProjectCampaignV2(legacyProject());
  console.log(JSON.stringify(p.campaignSetup, null, 2));
}

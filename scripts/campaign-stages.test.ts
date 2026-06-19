/**
 * Tests stades d'acquisition.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { inferAcquisitionStage, suggestScaleStage } from "../src/lib/campaign/infer-stage";
import {
  isToolCategoryHiddenForStage,
  profileFromStage,
  stageFromLegacyProfile,
} from "../src/lib/campaign/stages";
import { filterToolsForStage } from "../src/lib/campaign/recommend";
import { getToolsByChannel } from "../src/lib/campaign/tools";
import type { UserProject } from "../src/lib/portfolio";

function baseProject(overrides: Partial<UserProject> = {}): UserProject {
  return {
    id: "p1",
    opportunitySlug: "x",
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

test("network stage — pas de video tools", () => {
  assert.equal(isToolCategoryHiddenForStage("network", "video"), true);
  const tools = filterToolsForStage(getToolsByChannel("linkedin", "organic"), "network");
  assert.ok(!tools.some((t) => t.category === "video"));
});

test("profileFromStage — organic pour network", () => {
  assert.equal(profileFromStage("network"), "organic");
  assert.equal(profileFromStage("scale"), "paid-scale");
});

test("stageFromLegacyProfile migration", () => {
  assert.equal(stageFromLegacyProfile("organic", "cold_email"), "outreach");
  assert.equal(stageFromLegacyProfile("paid-light"), "amplification");
});

test("inferAcquisitionStage — default network", () => {
  assert.equal(inferAcquisitionStage(baseProject()), "network");
});

test("inferAcquisitionStage — has_mrr minimum content", () => {
  const p = baseProject({
    builderStage: "has_mrr",
    currentMrr: 120,
  });
  assert.equal(inferAcquisitionStage(p), "content");
});

test("suggestScaleStage — MRR élevé", () => {
  assert.equal(suggestScaleStage(baseProject({ currentMrr: 600 })), true);
});

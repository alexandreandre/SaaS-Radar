import assert from "node:assert/strict";
import test from "node:test";
import type { UserProject } from "@/lib/portfolio";
import { getStageGuidance } from "@/lib/campaign/stage-guidance";

const baseProject = {
  id: "p1",
  opportunitySlug: "test",
  startedAt: "2026-01-01",
  phase: "launch" as const,
  currentMrr: 0,
  mrrHistory: [],
  targetScenario: "base" as const,
  milestones: [],
  checkInStreak: 0,
  createdAt: "2026-01-01",
};

test("getStageGuidance — démarre en réseau", () => {
  const g = getStageGuidance(baseProject as UserProject);
  assert.equal(g.stage, "network");
  assert.equal(g.badge, "recommended");
  assert.match(g.reason, /démarrez/i);
});

test("getStageGuidance — MRR existant → contenu", () => {
  const project = {
    ...baseProject,
    currentMrr: 420,
    builderStage: "has_mrr" as const,
  } as UserProject;
  const g = getStageGuidance(project);
  assert.equal(g.stage, "content");
  assert.match(g.reason, /déjà des clients/i);
  assert.equal(g.typicalClients, "31–60 clients");
});

test("getStageGuidance — override manuel", () => {
  const project = {
    ...baseProject,
    currentMrr: 420,
    builderStage: "has_mrr" as const,
    campaignSetup: {
      acquisitionStage: "outreach",
      stageOverride: true,
      primaryChannel: "cold_email",
      activeToolIds: [],
      workflow: [],
      kitsByTool: {},
      actionItems: [],
      weeklyCheckIns: [],
      cycleStatus: "draft",
    },
  } as UserProject;
  const g = getStageGuidance(project, "cold_email");
  assert.equal(g.stage, "outreach");
  assert.equal(g.recommendedStage, "content");
  assert.equal(g.badge, "manual");
});

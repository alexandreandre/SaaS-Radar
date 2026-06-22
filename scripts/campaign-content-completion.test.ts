/**
 * Tests complétion phase Création — assets confirmés.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isCreationComplete,
  getCreationGaps,
} from "../src/lib/campaign/phases";
import {
  buildContentDeriveContext,
  deriveAllContentAssets,
  isContentCreativeReady,
} from "../src/lib/campaign/content-derive";
import { fieldsToRecord, isContentAssetConfirmed } from "../src/lib/campaign/content-schemas";
import { contentAssetAnchorId } from "../src/lib/campaign/content-constants";
import type { UserProject } from "../src/lib/portfolio";
import type { Opportunity } from "../src/types/opportunity";
import { getInfraGates } from "../src/lib/campaign/infra-gates";
import { recommendGtmMotion } from "../src/lib/campaign/gtm-engine";
import { defaultSmartGoalForStage } from "../src/lib/campaign/stages";

function baseProject(overrides: Partial<UserProject> = {}): UserProject {
  return {
    id: "p1",
    opportunitySlug: "dental-async",
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
    primaryChannel: "seo" as const,
    activeToolIds: [] as const,
    workflow: [],
    kitsByTool: {},
    actionItems: [],
    weeklyCheckIns: [],
    cycleStatus: "draft" as const,
    profile: "organic" as const,
    smartGoal: defaultSmartGoalForStage("network"),
    icpSummary: "Dentistes",
    strategyBrief: "Brief",
    positioning: "MouthWatch : suivi patient asynchrone.",
    foundationsRiver: {
      completedAt: "2025-01-01",
      supportChannelKeys: ["referral"],
    },
    ...overrides,
  };
}

const opportunity = {
  name: "Téléconsultation dentaire",
  slug: "dental-async",
  targetClient: "Dentistes indépendants",
  pitch: "Suivi patient",
  sector: "healthcare",
  foreignMarketProfile: {
    problemSolved: "Communication asynchrone sécurisée entre dentistes et patients.",
  },
  acquisition: [],
  cacChannels: [],
  financialScenarios: [],
} as Opportunity;

function confirmedAssets(project: UserProject) {
  const ctx = buildContentDeriveContext(project, opportunity);
  const derived = deriveAllContentAssets(ctx);
  const contentAssets: NonNullable<UserProject["campaignSetup"]>["contentAssets"] = {};
  for (const [id, asset] of Object.entries(derived)) {
    contentAssets[id] = {
      ...asset,
      confirmedAt: "2025-01-02",
    };
  }
  return contentAssets;
}

test("isCreationComplete — false sans confirm", () => {
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup({
      contentStudio: { startedAt: "2025-01-01" },
      contentAssets: {},
    }),
  });
  assert.equal(isCreationComplete(project, opportunity), false);
});

test("isCreationComplete — true quand tous required confirmés", () => {
  const base = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup(),
  });
  const contentAssets = confirmedAssets(base);
  for (const asset of Object.values(contentAssets)) {
    assert.equal(isContentAssetConfirmed(asset), true);
  }
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup({
      contentAssets,
      contentStudio: { startedAt: "2025-01-01", completedAt: "2025-01-02" },
    }),
  });
  assert.equal(isCreationComplete(project, opportunity), true);
});

test("isCreationComplete — false sans checklist legacy", () => {
  const project = baseProject({
    campaignSetup: baseSetup({
      foundationsRiver: undefined,
      assetChecklist: [true, true, false, false],
    }),
  });
  assert.equal(isCreationComplete(project), false);
});

test("getCreationGaps — libellés par asset", () => {
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup({
      contentStudio: { startedAt: "2025-01-01" },
    }),
  });
  const gaps = getCreationGaps(project, opportunity);
  assert.ok(gaps.some((g) => g.id === "content-landing"));
  assert.ok(gaps.some((g) => g.id === "content-seo"));
  assert.ok(gaps.some((g) => g.label.includes("landing") || g.label.includes("Site")));
  assert.ok(gaps.some((g) => g.anchorId === contentAssetAnchorId("landing")));
});

test("getCreationGaps — vide quand tous confirmés", () => {
  const base = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup(),
  });
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup({
      contentAssets: confirmedAssets(base),
      contentStudio: { startedAt: "2025-01-01", completedAt: "2025-01-02" },
    }),
  });
  const contentGaps = getCreationGaps(project, opportunity).filter((g) =>
    g.id.startsWith("content-"),
  );
  assert.equal(contentGaps.length, 0);
});

test("isContentCreativeReady — true après atelier complet", () => {
  const base = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup(),
  });
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup({
      contentAssets: confirmedAssets(base),
      contentStudio: { startedAt: "2025-01-01", completedAt: "2025-01-02" },
    }),
  });
  assert.equal(isContentCreativeReady(project), true);
  const motion = recommendGtmMotion("network", "seo", project.campaignSetup);
  const gates = getInfraGates(project, motion);
  assert.ok(gates.find((g) => g.id === "creative_ready")?.satisfied);
});

test("confirmed asset fields — enregistrement cohérent", () => {
  const base = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup(),
  });
  const derived = deriveAllContentAssets(buildContentDeriveContext(base, opportunity));
  const landing = derived.landing!;
  const record = fieldsToRecord(landing.fields);
  assert.ok(record.h1);
  assert.ok(record.cta);
});

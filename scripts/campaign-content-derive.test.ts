/**
 * Tests moteur de dérivation contenu — atelier Création.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildContentDeriveContext,
  deriveAllContentAssets,
  deriveContentAsset,
  resolveContentAssets,
} from "../src/lib/campaign/content-derive";
import { deriveMessageAdaptations } from "../src/lib/campaign/foundations-river";
import { assetFieldsMap } from "../src/lib/campaign/content-schemas";
import type { UserProject } from "../src/lib/portfolio";
import type { Opportunity } from "../src/types/opportunity";
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
    icpSummary: "Dentistes indépendants",
    strategyBrief: "Brief",
    positioning:
      "MouthWatch TeleDent : vos patients écrivent, vous répondez à votre rythme.",
    foundationsRiver: {
      completedAt: "2025-01-01",
      supportChannelKeys: ["referral"],
      goalStrategyId: "trust",
    },
    ...overrides,
  };
}

const healthcareOpportunity = {
  name: "Téléconsultation dentaire",
  slug: "dental-async",
  targetClient:
    "Dentistes indépendants et petits cabinets dentaires qui veulent proposer de la téléconsultation asynchrone légère.",
  pitch: "Communication asynchrone sécurisée pour cabinets dentaires.",
  sector: "healthcare",
  foreignMarketProfile: {
    problemSolved:
      "Faciliter la communication asynchrone et sécurisée entre dentistes et patients pour des suivis, des avis ou des questions, sans nécessiter une consultation physique ou synchrone.",
  },
  acquisition: [{ id: "1", title: "LinkedIn", tactics: ["Poster"] }],
  cacChannels: [{ channel: "LinkedIn", estimate: 80, note: "test" }],
  financialScenarios: [{ name: "Réaliste", clients: 5, mrr: 1000 }],
} as Opportunity;

test("deriveAllContentAssets — trust SEO + referral (MouthWatch)", () => {
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup({ primaryChannel: "seo" }),
  });
  const ctx = buildContentDeriveContext(project, healthcareOpportunity);
  const assets = deriveAllContentAssets(ctx);

  assert.ok(assets.landing);
  assert.ok(assets.seo);
  assert.ok(assets.referral);
  assert.equal(Object.keys(assets).length, 3);

  const landing = assetFieldsMap(assets.landing!);
  assert.match(landing.h1!, /^[A-ZÉÈÀ]/);
  assert.ok(!landing.h1!.includes("—"));
  assert.ok(landing.h1!.includes("MouthWatch"));
  assert.ok(landing.subtitle!.length > 10);

  const seo = assetFieldsMap(assets.seo!);
  assert.ok(seo.metaTitle!.length > 0);
  assert.ok(seo.metaDescription!.length > 20);
});

test("deriveContentAsset — google headlines ≤ 30 car.", () => {
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup({
      primaryChannel: "google",
      foundationsRiver: {
        completedAt: "2025-01-01",
        supportChannelKeys: ["referral"],
        goalStrategyId: "accelerate",
      },
    }),
  });
  const ctx = buildContentDeriveContext(project, healthcareOpportunity);
  const google = deriveContentAsset("google", ctx)!;
  const fields = assetFieldsMap(google);

  assert.ok(fields.headline1!.length <= 30);
  assert.ok(fields.headline2!.length <= 30);
  assert.ok(fields.headline3!.length <= 30);
  assert.ok(fields.description1!.length <= 90);
  assert.ok(fields.description2!.length <= 90);
});

test("deriveContentAsset — meta et tiktok remplis", () => {
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup({
      primaryChannel: "meta",
      foundationsRiver: {
        completedAt: "2025-01-01",
        supportChannelKeys: ["tiktok"],
      },
    }),
  });
  const ctx = buildContentDeriveContext(project, healthcareOpportunity);
  const meta = assetFieldsMap(deriveContentAsset("meta", ctx)!);
  const tiktok = assetFieldsMap(deriveContentAsset("tiktok", ctx)!);

  assert.ok(meta.primaryText!.length > 10);
  assert.ok(meta.headline!.length > 0);
  assert.ok(tiktok.hook3s!.length > 5);
  assert.ok(tiktok.script15s!.includes("[0-3 s]"));
  assert.ok(tiktok.hook3s!.split("\n").length <= 2);
});

test("resolveContentAssets — persisté prioritaire sur dérivé", () => {
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup(),
  });
  const ctx = buildContentDeriveContext(project, healthcareOpportunity);
  const derived = deriveAllContentAssets(ctx);
  const customH1 = "Mon titre personnalisé pour la landing";
  const persisted = {
    ...derived.landing!,
    fields: derived.landing!.fields.map((f) =>
      f.key === "h1" ? { ...f, value: customH1 } : f,
    ),
    confirmedAt: "2025-01-02",
    source: "edited" as const,
  };

  const resolved = resolveContentAssets(
    { ...baseSetup(), contentAssets: { landing: persisted } },
    ctx,
  );
  assert.equal(assetFieldsMap(resolved.landing!).h1, customH1);
  assert.equal(resolved.landing!.confirmedAt, "2025-01-02");
});

test("resolveContentAssets — legacy sans contentAssets dérive OK", () => {
  const project = baseProject({
    productName: "MouthWatch TeleDent",
    campaignSetup: baseSetup({ contentAssets: undefined }),
  });
  const ctx = buildContentDeriveContext(project, healthcareOpportunity);
  const resolved = resolveContentAssets(project.campaignSetup, ctx);
  assert.ok(resolved.landing);
  assert.ok(resolved.seo);
});

test("copies dérivées — pas de tiret cadratin", () => {
  const core =
    "MouthWatch TeleDent : vos patients écrivent, vous répondez à votre rythme.";
  const adaptations = deriveMessageAdaptations(core, "seo", ["referral"], {
    productName: "MouthWatch TeleDent",
    who: healthcareOpportunity.targetClient!,
    pain: healthcareOpportunity.foreignMarketProfile!.problemSolved,
  });
  for (const a of adaptations) {
    assert.ok(!a.text.includes("—"), `tiret cadratin dans ${a.channel}`);
  }
});

/**
 * Tests parcours rivière — fondations campagne.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatAudienceRecap,
  formatGoalRecap,
  buildAudienceDraft,
  buildGoalDraft,
  buildRiverGoalStrategies,
  resolveGoalFromStrategy,
  goalPayloadToSmartGoal,
  buildMessageDraft,
  deriveMessageAdaptations,
  resolveMessageAdaptations,
  generateMessageVariants,
  painToBenefitPhrase,
  clampMessage,
  formatMessageRecap,
  buildFoundationsRiverDraft,
  buildChannelOptions,
  isFoundationsRiverComplete,
  isLegacyFoundationsDataComplete,
  isLegacyIcpSummaryText,
  isFoundationsCompleteWithRiver,
  recommendPositioningLine,
  resolveFoundationsRiverStop,
} from "../src/lib/campaign/foundations-river";
import { recommendIcpSummary, recommendRiverChannelForStage } from "../src/lib/campaign/recommend";
import type { UserProject } from "../src/lib/portfolio";
import { defaultSmartGoalForStage } from "../src/lib/campaign/stages";
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
    ...overrides,
  };
}

const minimalOpportunity = {
  name: "Devis BTP",
  slug: "quote-generator-contractors",
  targetClient: "Artisans BTP",
  pitch: "Devis rapides pour artisans",
  sector: "construction",
  acquisition: [{ id: "1", title: "LinkedIn", tactics: ["Poster"] }],
  cacChannels: [{ channel: "LinkedIn", estimate: 80, note: "test" }],
  financialScenarios: [{ name: "Réaliste", clients: 5, mrr: 1000 }],
} as Opportunity;

test("resolveFoundationsRiverStop — intro sans démarrage", () => {
  const project = baseProject({ campaignSetup: baseSetup() });
  assert.equal(resolveFoundationsRiverStop(project), "intro");
});

test("resolveFoundationsRiverStop — audience après start", () => {
  const project = baseProject({
    campaignSetup: baseSetup({
      foundationsRiver: { startedAt: "2025-01-01" },
    }),
  });
  assert.equal(resolveFoundationsRiverStop(project), "audience");
});

test("resolveFoundationsRiverStop — legacy complet va au dock", () => {
  const project = baseProject({
    campaignSetup: baseSetup({
      smartGoal: defaultSmartGoalForStage("network"),
      icpSummary: "PME BTP",
      positioning: "Accroche test",
      primaryChannel: "linkedin",
    }),
  });
  assert.equal(resolveFoundationsRiverStop(project), "dock");
});

test("buildFoundationsRiverDraft — contenu minimal", () => {
  const draft = buildFoundationsRiverDraft(
    baseProject({ campaignSetup: baseSetup() }),
    minimalOpportunity,
    "network",
  );
  assert.ok(draft.audience.who.includes("Artisans"));
  assert.ok(draft.goal.strategies.length >= 1);
  assert.ok(draft.goal.selectedStrategyId);
  assert.ok(draft.message.variants.length >= 1);
  assert.ok(draft.message.positioning.length > 10);
  assert.ok(draft.channelOptions.length >= 1);
});

test("isFoundationsRiverComplete — 3 confirmations + dock", () => {
  assert.equal(
    isFoundationsRiverComplete(
      baseSetup({
        foundationsRiver: {
          audienceConfirmedAt: "a",
          goalConfirmedAt: "b",
          messageConfirmedAt: "c",
          completedAt: "d",
        },
      }),
    ),
    true,
  );
});

test("isFoundationsCompleteWithRiver — legacy OK", () => {
  assert.equal(
    isLegacyFoundationsDataComplete(
      baseSetup({
        smartGoal: defaultSmartGoalForStage("network"),
        icpSummary: "x",
        positioning: "y",
      }),
    ),
    true,
  );
  assert.equal(
    isFoundationsCompleteWithRiver(
      baseSetup({
        smartGoal: defaultSmartGoalForStage("network"),
        icpSummary: "x",
        positioning: "y",
      }),
    ),
    true,
  );
});

test("recommendPositioningLine — phrase courte sans . à faciliter", () => {
  const line = recommendPositioningLine(
    baseProject({ productName: "MouthWatch TeleDent" }),
    healthcareOpportunity,
    healthcareOpportunity.targetClient!,
    healthcareOpportunity.foreignMarketProfile!.problemSolved,
  );
  assert.ok(line.includes("MouthWatch"));
  assert.ok(!line.includes(". à"));
  assert.ok(!line.includes("faciliter la communication"));
  assert.ok(line.length <= 122);
});

test("generateMessageVariants — cas dentiste", () => {
  const variants = generateMessageVariants({
    productName: "MouthWatch TeleDent",
    who: healthcareOpportunity.targetClient!,
    pain: healthcareOpportunity.foreignMarketProfile!.problemSolved,
  });
  assert.equal(variants.length, 3);
  for (const v of variants) {
    assert.ok(v.text.length <= 122, v.id);
    assert.ok(!v.text.includes(". à"), v.id);
    assert.ok(!v.text.includes("—"), `${v.id} : pas de tiret cadratin`);
    assert.ok(!/ entre[,.]/.test(v.text), `${v.id} : phrase coupée sur « entre »`);
  }
  assert.ok(variants.some((v) => v.text.includes("MouthWatch TeleDent")));
  assert.ok(
    variants.some(
      (v) =>
        v.text.includes("suivi patient") ||
        v.text.includes("patients écrivent") ||
        v.text.includes("rendez-vous"),
    ),
  );
});

test("generateMessageVariants — déclinaisons cohérentes (cas dentiste)", () => {
  const variants = generateMessageVariants({
    productName: "MouthWatch TeleDent",
    who: healthcareOpportunity.targetClient!,
    pain: healthcareOpportunity.foreignMarketProfile!.problemSolved,
    goalStrategyId: "trust",
  });
  const recommended = variants.find((v) => v.recommended)!;
  const adaptations = deriveMessageAdaptations(recommended.text, "seo", ["referral"], {
    productName: "MouthWatch TeleDent",
    who: healthcareOpportunity.targetClient!,
    pain: healthcareOpportunity.foreignMarketProfile!.problemSolved,
  });
  assert.ok(adaptations.length === 3);
  assert.match(adaptations[0]!.text, /^[A-ZÉÈÀ]/, "landing doit commencer par une majuscule");
  assert.ok(adaptations[0]!.text.includes("MouthWatch"), "landing inclut le produit");
  assert.ok(adaptations[1]!.text.includes("Téléconsultation") || adaptations[1]!.text.includes("Comment"));
  for (const a of adaptations) {
    assert.ok(!a.text.includes("—"), `${a.label} : pas de tiret cadratin`);
    assert.ok(!/ entre[.]?$/.test(a.text), `${a.label} : fin de phrase incomplète`);
    assert.ok(a.text.length > 15, a.label);
  }
});

test("buildMessageDraft — utilise pain confirmé audience", () => {
  const audience = {
    who: "Orthodontistes en zone rurale",
    pain: "Manque de suivi entre deux rendez-vous",
    icpSummary: "x",
  };
  const draft = buildMessageDraft(
    baseProject({ productName: "MouthWatch TeleDent" }),
    healthcareOpportunity,
    audience,
  );
  assert.ok(draft.variants.length === 3);
  assert.ok(draft.positioning.includes("MouthWatch"));
  assert.ok(
    draft.positioning.toLowerCase().includes("suivi") ||
      draft.variants.some((v) => v.text.toLowerCase().includes("suivi")),
  );
  assert.ok(draft.adaptations.length >= 2);
});

test("deriveMessageAdaptations — trust SEO + Recommandation (MouthWatch)", () => {
  const core =
    "MouthWatch TeleDent : vos patients écrivent, vous répondez à votre rythme.";
  const ctx = {
    productName: "MouthWatch TeleDent",
    who: healthcareOpportunity.targetClient!,
    pain: healthcareOpportunity.foreignMarketProfile!.problemSolved,
  };
  const adaptations = deriveMessageAdaptations(core, "seo", ["referral"], ctx);
  assert.equal(adaptations.length, 3);
  assert.equal(adaptations[0]!.channel, "landing");
  assert.match(adaptations[0]!.text, /^MouthWatch/);
  assert.match(adaptations[0]!.text, /^[A-ZÉÈÀ]/);
  assert.equal(adaptations[1]!.channel, "seo");
  assert.ok(adaptations[1]!.text.includes("Téléconsultation") || adaptations[1]!.text.includes("patient"));
  assert.equal(adaptations[2]!.channel, "referral");
  const texts = adaptations.map((a) => a.text);
  assert.equal(new Set(texts).size, texts.length);
});

test("deriveMessageAdaptations — accelerate google + referral, pub plus court", () => {
  const core =
    "MouthWatch TeleDent : téléconsultation asynchrone sécurisée pour cabinets dentaires qui veulent un suivi patient sans rendez-vous obligatoire.";
  const adaptations = deriveMessageAdaptations(core, "google", ["referral"]);
  assert.equal(adaptations.length, 3);
  assert.ok(adaptations[0]!.text.length <= 60);
  assert.ok(adaptations[1]!.text.length <= 80);
  assert.ok(adaptations[1]!.text.length <= adaptations[0]!.text.length);
});

test("buildMessageDraft — adaptations avec goal trust", () => {
  const options = buildChannelOptions(healthcareSeoOpportunity, "network");
  const goal = buildGoalDraft(
    baseProject({ campaignSetup: baseSetup({ acquisitionStage: "network" }) }),
    healthcareSeoOpportunity,
    "network",
    options,
  );
  const audience = buildAudienceDraft(
    baseProject({ productName: "MouthWatch TeleDent" }),
    healthcareOpportunity,
  );
  const draft = buildMessageDraft(
    baseProject({ productName: "MouthWatch TeleDent" }),
    healthcareOpportunity,
    audience,
    goal,
  );
  assert.ok(draft.adaptations.length >= 2);
  assert.ok(draft.adaptations.some((a) => a.channel === "landing"));
  assert.ok(draft.adaptations.some((a) => a.channel === goal.channel));
});

test("resolveMessageAdaptations — legacy sans messageAdaptations persistées", () => {
  const setup = baseSetup({
    positioning: "MouthWatch : suivi asynchrone sécurisé.",
    primaryChannel: "seo",
    foundationsRiver: {
      supportChannelKeys: ["referral"],
      messageConfirmedAt: "2025-01-01",
    },
  });
  const adaptations = resolveMessageAdaptations(setup);
  assert.ok(adaptations.length >= 2);
  assert.ok(adaptations.every((a) => a.text.length > 0));
});

test("painToBenefitPhrase — retire Faciliter", () => {
  const benefit = painToBenefitPhrase(
    "Faciliter la communication asynchrone et sécurisée entre dentistes et patients.",
  );
  assert.ok(!/^faciliter/i.test(benefit));
  assert.ok(benefit.includes("communication"));
});

test("formatMessageRecap — guillemets et longueur", () => {
  const short = formatMessageRecap(
    baseSetup({ positioning: "MouthWatch : des échanges sécurisés." }),
  );
  assert.ok(short.startsWith("«"));
  assert.ok(short.includes("MouthWatch"));
});

test("buildChannelOptions — filtre par stade", () => {
  const options = buildChannelOptions(minimalOpportunity, "network");
  assert.ok(options.some((o) => o.key === "linkedin"));
});

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

test("isLegacyIcpSummaryText — détecte le format admin", () => {
  const legacy = recommendIcpSummary(healthcareOpportunity);
  assert.equal(isLegacyIcpSummaryText(legacy), true);
  assert.equal(isLegacyIcpSummaryText("PME BTP indépendantes"), false);
});

test("buildAudienceDraft — ignore icpStructured legacy (migration v2)", () => {
  const legacySummary = recommendIcpSummary(healthcareOpportunity);
  const draft = buildAudienceDraft(
    baseProject({
      campaignSetup: baseSetup({
        icpSummary: legacySummary,
        icpStructured: {
          segment: legacySummary.slice(0, 200),
          pain: "Accroche positioning migrée",
        },
      }),
    }),
    healthcareOpportunity,
  );
  assert.ok(draft.who.includes("Dentistes"));
  assert.ok(!draft.who.includes("secteur healthcare"));
  assert.ok(!draft.who.includes("Problème :"));
  assert.ok(draft.pain.includes("communication asynchrone"));
  assert.notEqual(draft.pain, "Accroche positioning migrée");
});

test("buildAudienceDraft — healthcare sans pollution legacy", () => {
  const draft = buildAudienceDraft(
    baseProject({ campaignSetup: baseSetup() }),
    healthcareOpportunity,
  );
  assert.equal(
    draft.who,
    "Dentistes indépendants et petits cabinets dentaires qui veulent proposer de la téléconsultation asynchrone légère.",
  );
  assert.ok(draft.pain.includes("Faciliter la communication"));
});

test("buildAudienceDraft — préfère icpStructured confirmé par l'utilisateur", () => {
  const draft = buildAudienceDraft(
    baseProject({
      campaignSetup: baseSetup({
        foundationsRiver: {
          startedAt: "2025-01-01",
          audienceConfirmedAt: "2025-01-02",
        },
        icpStructured: {
          segment: "Orthodontistes en zone rurale",
          pain: "Manque de suivi entre deux rendez-vous",
        },
      }),
    }),
    healthcareOpportunity,
  );
  assert.equal(draft.who, "Orthodontistes en zone rurale");
  assert.equal(draft.pain, "Manque de suivi entre deux rendez-vous");
});

test("formatAudienceRecap — évite le format legacy au débarcadère", () => {
  const legacySummary = recommendIcpSummary(healthcareOpportunity);
  const recap = formatAudienceRecap(
    baseSetup({
      icpSummary: legacySummary,
      icpStructured: { segment: legacySummary.slice(0, 200), pain: "x" },
    }),
    healthcareOpportunity,
  );
  assert.ok(!recap.includes("secteur healthcare"));
  assert.ok(!recap.includes("Problème :"));
  assert.ok(recap.includes("Dentistes"));
});

const healthcareSeoOpportunity = {
  ...healthcareOpportunity,
  acquisition: [
    { id: "1", title: "SEO", tactics: ["Blog"] },
    { id: "2", title: "Referral", tactics: ["Partenaires"] },
  ],
  cacChannels: [
    { channel: "SEO", estimate: 30, note: "test" },
    { channel: "Referral", estimate: 20, note: "test" },
  ],
} as Opportunity;

test("recommendRiverChannelForStage — priorise Recommandation sur SEO", () => {
  assert.equal(recommendRiverChannelForStage(healthcareSeoOpportunity, "network"), "referral");
});

test("buildRiverGoalStrategies — SEO + Recommandation en parallèle", () => {
  const options = buildChannelOptions(healthcareSeoOpportunity, "network");
  const strategies = buildRiverGoalStrategies(options, healthcareSeoOpportunity);
  const trust = strategies.find((s) => s.id === "trust");
  assert.ok(trust);
  assert.deepEqual(trust!.supportChannels, ["referral"]);
  assert.ok(trust!.subtitle.includes("parallèle"));
});

const healthcareFullOpportunity = {
  ...healthcareSeoOpportunity,
  acquisition: [
    { id: "1", title: "SEO", tactics: ["Blog"] },
    { id: "2", title: "Referral", tactics: ["Partenaires"] },
    { id: "3", title: "Google Ads", tactics: ["Search"] },
  ],
  cacChannels: [
    { channel: "SEO", estimate: 30, note: "test" },
    { channel: "Referral", estimate: 20, note: "test" },
    { channel: "Google Ads", estimate: 120, note: "test" },
  ],
} as Opportunity;

test("buildRiverGoalStrategies — SEA + Recommandation en parallèle", () => {
  const options = buildChannelOptions(healthcareFullOpportunity, "network");
  const strategies = buildRiverGoalStrategies(options, healthcareFullOpportunity);
  const accelerate = strategies.find((s) => s.id === "accelerate");
  assert.ok(accelerate);
  assert.equal(accelerate!.primaryChannel, "google");
  assert.deepEqual(accelerate!.supportChannels, ["referral"]);
  assert.ok(accelerate!.recommended);
});

test("buildGoalDraft — pas de chiffre exposé, approche suggérée", () => {
  const options = buildChannelOptions(healthcareSeoOpportunity, "network");
  const goal = buildGoalDraft(
    baseProject({ campaignSetup: baseSetup({ acquisitionStage: "network" }) }),
    healthcareSeoOpportunity,
    "network",
    options,
  );
  assert.ok(goal.strategies.length >= 2);
  assert.ok(goal.recapLabel.length > 5);
  assert.ok(!goal.label.match(/^\d+/));
});

test("goalPayloadToSmartGoal — label narratif sans chiffre en tête", () => {
  const options = buildChannelOptions(healthcareSeoOpportunity, "network");
  const strategies = buildRiverGoalStrategies(options, healthcareSeoOpportunity);
  const trust = strategies.find((s) => s.id === "trust")!;
  const resolved = resolveGoalFromStrategy(trust, "network", 5);
  const smart = goalPayloadToSmartGoal(resolved);
  assert.ok(smart.label.includes("Se faire connaître"));
  assert.ok(smart.label.includes("parallèle"));
  assert.ok(smart.targetValue >= 1);
});

test("formatGoalRecap — approche humaine au débarcadère", () => {
  const recap = formatGoalRecap(
    baseSetup({
      primaryChannel: "google",
      foundationsRiver: {
        goalStrategyId: "accelerate",
        supportChannelKeys: ["referral"],
      },
      smartGoal: {
        label: "Accélérer avec de la pub — Google Ads (SEA) + recommandations en parallèle",
        metric: "signups",
        targetValue: 20,
        horizonDays: 30,
        setAt: "2025-01-01",
      },
    }),
  );
  assert.ok(recap.includes("Accélérer"));
  assert.ok(recap.includes("parallèle"));
  assert.ok(!recap.match(/^\d+\s+conversations/));
});

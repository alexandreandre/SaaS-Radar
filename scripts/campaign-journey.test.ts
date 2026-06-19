/**
 * Tests unitaires du parcours campagne.
 * Exécution : npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { getCampaignJourneyState } from "../src/lib/campaign/journey";
import { removeCampaignTool } from "../src/lib/portfolio";
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
} as Opportunity;

test("étape 1 — sans profil ni brief", () => {
  const state = getCampaignJourneyState(baseProject(), minimalOpportunity);
  assert.equal(state.currentStep, 1);
  assert.equal(state.displayPhase, "strategy");
});

test("étape 2 — brief validé sans kit", () => {
  const state = getCampaignJourneyState(
    baseProject({
      marketingProfile: "organic",
      campaignSetup: {
        profile: "organic",
        primaryChannel: "linkedin",
        activeToolIds: ["claude"],
        workflow: [],
        strategyBrief: "Brief stratégie ".repeat(20),
        kitsByTool: {},
      },
    }),
    minimalOpportunity,
  );
  assert.equal(state.currentStep, 2);
  assert.equal(state.displayPhase, "creating");
});

test("étape 4 — kit généré (organic saute la diffusion)", () => {
  const state = getCampaignJourneyState(
    baseProject({
      marketingProfile: "organic",
      campaignSetup: {
        profile: "organic",
        primaryChannel: "linkedin",
        activeToolIds: ["claude"],
        workflow: [],
        strategyBrief: "Brief",
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
      },
    }),
    minimalOpportunity,
  );
  assert.equal(state.currentStep, 4);
  assert.equal(state.displayPhase, "measuring");
});

test("étape 3 — kit généré, profil paid-light", () => {
  const state = getCampaignJourneyState(
    baseProject({
      marketingProfile: "paid-light",
      campaignSetup: {
        profile: "paid-light",
        primaryChannel: "linkedin",
        activeToolIds: ["claude"],
        workflow: [],
        strategyBrief: "Brief",
        kitsByTool: {
          claude: {
            toolId: "claude",
            channelKey: "linkedin",
            profile: "paid-light",
            brief: "b",
            primaryPrompt: "prompt ".repeat(20),
            generatedAt: "2025-01-01",
          },
        },
      },
    }),
    minimalOpportunity,
  );
  assert.equal(state.currentStep, 3);
  assert.equal(state.displayPhase, "distributing");
});

test("warning si app pas en ligne", () => {
  const state = getCampaignJourneyState(baseProject(), minimalOpportunity);
  assert.ok(state.appOnlineWarning);
});

test("app en ligne — pas de warning", () => {
  const state = getCampaignJourneyState(
    baseProject({
      hostConnection: {
        provider: "custom",
        productionUrl: "https://example.com",
        connectedAt: "2025-01-01",
      },
    }),
    minimalOpportunity,
  );
  assert.equal(state.appOnline, true);
  assert.equal(state.appOnlineWarning, undefined);
});

test("removeCampaignTool retire outil et kit", () => {
  const project = baseProject({
    marketingProfile: "organic",
    activeCampaignToolIds: ["claude", "canva"],
    campaignSetup: {
      profile: "organic",
      primaryChannel: "linkedin",
      activeToolIds: ["claude", "canva"],
      workflow: [],
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
    },
  });
  const next = removeCampaignTool(project, "canva");
  assert.deepEqual(next.campaignSetup?.activeToolIds, ["claude"]);
  assert.equal(next.campaignSetup?.kitsByTool.canva, undefined);
});

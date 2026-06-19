/**
 * Tests unitaires du parcours build (phases d'affichage stepper).
 * Exécution : npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { getBuildJourneyState } from "../src/lib/build/journey";
import { migrateProject, type UserProject } from "../src/lib/portfolio";

function baseProject(overrides: Partial<UserProject> = {}): UserProject {
  return {
    id: "p1",
    opportunitySlug: "quote-generator-contractors",
    startedAt: "2025-01-01",
    phase: "build",
    currentMrr: 0,
    mrrHistory: [],
    targetScenario: "realistic",
    milestones: [],
    checkInStreak: 0,
    createdAt: "2025-01-01",
    ...overrides,
  };
}

test("displayPhase onboarding — étape 1 sans outil", () => {
  const state = getBuildJourneyState(baseProject());
  assert.equal(state.currentStep, 1);
  assert.equal(state.displayPhase, "onboarding");
  assert.equal(state.showCoachCopy, true);
});

test("displayPhase onboarding — niveau choisi mais sans outil (étape 1)", () => {
  const state = getBuildJourneyState(
    baseProject({ buildDevLevel: "advanced" }),
  );
  assert.equal(state.currentStep, 1);
  assert.equal(state.displayPhase, "onboarding");
  assert.equal(state.showCoachCopy, true);
});

test("displayPhase building — outil choisi, pas de kit", () => {
  const state = getBuildJourneyState(
    baseProject({
      buildDevLevel: "advanced",
      activeBuildToolId: "cursor",
    }),
  );
  assert.equal(state.currentStep, 2);
  assert.equal(state.displayPhase, "building");
  assert.equal(state.showCoachCopy, true);
});

test("displayPhase deploy — kit généré, pas en ligne", () => {
  const state = getBuildJourneyState(
    baseProject({
      activeBuildToolId: "cursor",
      buildKitsByTool: {
        cursor: {
          toolId: "cursor",
          mvpPrompt: "x".repeat(300),
          setupRecipe: "",
          generatedAt: "2025-01-01",
        },
      },
    }),
  );
  assert.equal(state.currentStep, 3);
  assert.equal(state.displayPhase, "deploy");
  assert.equal(state.showCoachCopy, false);
});

test("displayPhase live — URL de production renseignée", () => {
  const state = getBuildJourneyState(
    baseProject({
      activeBuildToolId: "lovable",
      buildKitsByTool: {
        lovable: {
          toolId: "lovable",
          mvpPrompt: "x".repeat(300),
          setupRecipe: "",
          generatedAt: "2025-01-01",
        },
      },
      hostConnection: {
        provider: "custom",
        productionUrl: "https://app.lovable.app",
        connectedAt: "2025-01-02",
      },
    }),
  );
  assert.equal(state.displayPhase, "live");
  assert.equal(state.showCoachCopy, false);
});

test("secondaryDetail conservé en state mais hors stepper deploy", () => {
  const state = getBuildJourneyState(
    baseProject({
      activeBuildToolId: "cursor",
      buildKitsByTool: {
        cursor: {
          toolId: "cursor",
          mvpPrompt: "x".repeat(300),
          setupRecipe: "",
          generatedAt: "2025-01-01",
        },
        lovable: {
          toolId: "lovable",
          mvpPrompt: "y".repeat(300),
          setupRecipe: "",
          generatedAt: "2025-01-01",
        },
      },
    }),
  );
  assert.match(state.secondaryDetail ?? "", /Lovable/i);
  assert.equal(state.displayPhase, "deploy");
});

test("migrateProject remappe windsurf → codex sur tous les champs", () => {
  const windsurfKit = {
    toolId: "windsurf",
    mvpPrompt: "Utilisez Windsurf pour construire le MVP avec authentification Supabase.",
    setupRecipe: "Ouvrir Windsurf et coller le prompt.",
    generatedAt: "2025-06-01",
  };

  const migrated = migrateProject({
    ...baseProject(),
    activeBuildToolId: "windsurf" as never,
    buildKitsByTool: { windsurf: windsurfKit } as never,
    buildSetup: windsurfKit as never,
    buildSetupHistory: [{ ...windsurfKit, label: "windsurf" }] as never,
    githubTrackedRepos: [
      {
        repoFullName: "acme/windsurf-app",
        linkedToolId: "windsurf" as never,
        isPrimary: true,
        addedAt: "2025-06-01",
      },
    ],
  });

  assert.equal(migrated.activeBuildToolId, "codex");
  assert.ok(migrated.buildKitsByTool?.codex);
  assert.equal(migrated.buildKitsByTool?.codex?.toolId, "codex");
  assert.match(migrated.buildKitsByTool?.codex?.mvpPrompt ?? "", /Codex/i);
  assert.doesNotMatch(migrated.buildKitsByTool?.codex?.mvpPrompt ?? "", /Windsurf/i);
  assert.equal(migrated.buildSetup?.toolId, "codex");
  assert.equal(migrated.buildSetupHistory?.[0]?.toolId, "codex");
  assert.equal(migrated.githubTrackedRepos?.[0]?.linkedToolId, "codex");
});

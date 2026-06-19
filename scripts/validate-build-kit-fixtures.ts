/**
 * Valide les fixtures golden Emergent/Codex (structure kit sans réseau Gemini).
 * Exécution : npm test -- scripts/validate-build-kit-fixtures.ts
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { opportunities } from "../src/data/opportunities";
import { enrichOpportunity } from "../src/data/opportunity-enrichment";
import {
  collectProductFeatures,
  getInfraProfile,
} from "../src/lib/build/infra-profile";
import { buildSetupGuideSteps } from "../src/lib/build/setup-guide";
import { validateBuildPrompt } from "../src/lib/build/prompt-quality";
import { getPlatformTips } from "../src/lib/build/platform-tips";
import { getBuildTool } from "../src/lib/build/tools";
import { BUILTIN_DEPLOY_STEPS } from "../src/lib/build/tool-content";
import type { BuildToolId } from "../src/lib/build/tools";

type BuildKitFixture = {
  toolId: BuildToolId;
  opportunitySlug: string;
  language: "fr" | "en";
  requiredSetupKinds: string[];
  requiredSetupTitles?: string[];
  requiredKeywords: string[];
  sampleMvpPrompt: string;
};

const FIXTURES_DIR = join(import.meta.dirname, "fixtures/build-kits");

function loadFixtures(): BuildKitFixture[] {
  return readdirSync(FIXTURES_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const raw = readFileSync(join(FIXTURES_DIR, name), "utf8");
      return JSON.parse(raw) as BuildKitFixture;
    });
}

for (const fixture of loadFixtures()) {
  test(`fixture ${fixture.toolId} — kit cohérent pour ${fixture.opportunitySlug}`, () => {
    const tool = getBuildTool(fixture.toolId);
    assert.ok(tool, `outil inconnu: ${fixture.toolId}`);

    const opportunity = enrichOpportunity(
      opportunities.find((o) => o.slug === fixture.opportunitySlug)!,
    );
    const profile = getInfraProfile(opportunity, tool!);
    const steps = buildSetupGuideSteps({
      tool: tool!,
      productName: "SubbieRates",
      features: collectProductFeatures(opportunity),
      infraProfile: profile,
      language: fixture.language,
    });

    for (const kind of fixture.requiredSetupKinds) {
      assert.ok(
        steps.some((s) => s.kind === kind),
        `étape manquante: ${kind} pour ${fixture.toolId}`,
      );
    }

    for (const title of fixture.requiredSetupTitles ?? []) {
      assert.ok(
        steps.some((s) => s.title === title),
        `étape manquante: ${title} pour ${fixture.toolId}`,
      );
    }

    const tips = getPlatformTips(fixture.toolId);
    assert.ok(tips, `platform tips manquants pour ${fixture.toolId}`);

    if (tool!.deployModel === "builtin") {
      assert.ok(
        BUILTIN_DEPLOY_STEPS[fixture.toolId]?.length,
        `deploy guide manquant pour ${fixture.toolId}`,
      );
    }

    for (const keyword of fixture.requiredKeywords) {
      assert.match(
        fixture.sampleMvpPrompt,
        new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        `mot-clé absent du sample: ${keyword}`,
      );
    }

    const paddedPrompt = fixture.sampleMvpPrompt.repeat(6);
    const quality = validateBuildPrompt(paddedPrompt, profile, tool!);
    assert.equal(
      quality.ok,
      true,
      `prompt fixture invalide: ${quality.missing.join(", ")}`,
    );
  });
}

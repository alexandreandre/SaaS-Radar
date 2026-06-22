/**
 * Tests checklist assets campagne.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { getCampaignAssetChecklist } from "../src/lib/campaign/assets";

test("assets cold_email incluent objet email", () => {
  const items = getCampaignAssetChecklist("cold_email");
  assert.ok(items.some((i) => i.id === "email_subject"));
});

test("assets dérivés du kit distributionSteps", () => {
  const items = getCampaignAssetChecklist("linkedin", {
    toolId: "claude",
    channelKey: "linkedin",
    profile: "organic",
    brief: "b",
    primaryPrompt: "prompt test",
    distributionSteps: ["Publier sur LinkedIn", "Relancer les commentaires"],
    generatedAt: "2025-01-01",
  });
  assert.ok(items.some((i) => i.id === "kit_primary"));
  assert.ok(items.some((i) => i.label.includes("LinkedIn")));
});

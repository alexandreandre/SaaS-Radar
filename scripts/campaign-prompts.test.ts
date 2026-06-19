/**
 * Tests prompts campagne / re-export acquisition-content.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  generateAcquisitionContent,
  getGeneratorTabLabels,
} from "../src/lib/acquisition-content";
import { generateAcquisitionContent as fromCampaign } from "../src/lib/campaign/prompts";
import type { Opportunity } from "../src/types/opportunity";

const opportunity = {
  name: "TestSaaS",
  targetClient: "freelances",
  sector: "Productivité",
  acquisition: [{ id: "1", title: "Cold email", tactics: ["Hunter"] }],
  financialScenarios: [{ name: "Réaliste", clients: 10, avgPrice: 49, mrr: 490, grossMargin: 80 }],
} as Opportunity;

test("re-export acquisition-content identique", () => {
  const a = generateAcquisitionContent(opportunity, "Cold email", "prompt");
  const b = fromCampaign(opportunity, "Cold email", "prompt");
  assert.equal(a, b);
});

test("labels générateur cold email", () => {
  const labels = getGeneratorTabLabels("cold_email");
  assert.equal(labels.length, 3);
});

test("prompt cold email non vide", () => {
  const content = generateAcquisitionContent(opportunity, "Cold email", "email");
  assert.ok(content.includes("TestSaaS"));
});

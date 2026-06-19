/**
 * Tests recommandations campagne.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  recommendProfile,
  recommendPrimaryChannel,
  recommendTools,
} from "../src/lib/campaign/recommend";
import { buildWorkflowForStack } from "../src/lib/campaign/workflows";
import type { Opportunity } from "../src/types/opportunity";

const opportunity = {
  acquisition: [
    { id: "1", title: "Cold email", tactics: [] },
    { id: "2", title: "LinkedIn", tactics: [] },
  ],
  cacChannels: [
    { channel: "Cold email", estimate: 30, note: "low" },
    { channel: "LinkedIn", estimate: 120, note: "high" },
  ],
  financialScenarios: [],
  sector: "B2B",
  targetClient: "PME",
} as Opportunity;

test("recommendProfile organic pour CAC bas", () => {
  assert.equal(recommendProfile(opportunity, "cold_email"), "organic");
});

test("recommendProfile paid-light pour CAC moyen", () => {
  assert.equal(recommendProfile(opportunity, "linkedin"), "paid-light");
});

test("recommendProfile paid-scale pour CAC très élevé", () => {
  const highCac = {
    ...opportunity,
    cacChannels: [{ channel: "LinkedIn", estimate: 200, note: "very high" }],
  } as Opportunity;
  assert.equal(recommendProfile(highCac, "linkedin"), "paid-scale");
});

test("recommendPrimaryChannel depuis fiche", () => {
  assert.equal(recommendPrimaryChannel(opportunity), "cold_email");
});

test("recommendTools retourne des ids", () => {
  const tools = recommendTools(opportunity, "organic", "cold_email");
  assert.ok(tools.length >= 1);
  assert.ok(tools.includes("claude"));
});

test("workflow série cold_email", () => {
  const wf = buildWorkflowForStack("cold_email", ["claude", "lemlist"]);
  assert.equal(wf.length, 2);
  assert.equal(wf[0]?.mode, "series");
});

test("workflow parallèle tiktok", () => {
  const wf = buildWorkflowForStack("tiktok", ["higgsfield", "adcreative"]);
  assert.ok(wf.every((n) => n.mode === "parallel"));
});

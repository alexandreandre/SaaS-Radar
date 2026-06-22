/**
 * Tests séquences campagne v2.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSequenceId, CAMPAIGN_SEQUENCES } from "../src/lib/campaign/sequences";

test("resolveSequenceId — cold email", () => {
  assert.equal(resolveSequenceId("outreach", "cold_email"), "cold_email_21d");
});

test("resolveSequenceId — content seo", () => {
  assert.equal(resolveSequenceId("content", "seo"), "content_aeo_4w");
});

test("sequences have steps", () => {
  for (const seq of Object.values(CAMPAIGN_SEQUENCES)) {
    assert.ok(seq.steps.length >= 3, seq.id);
  }
});

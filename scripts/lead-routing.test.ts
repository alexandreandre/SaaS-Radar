/**
 * Tests unitaires du routage auto direct / draft.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertAutoPublishMinScoreValid,
  decideLeadDestination,
} from "../src/lib/sourcing/lead-routing";
import type { DedupMatch } from "../src/lib/admin/sourcing-dedup.shared";

const dedupHit: DedupMatch[] = [
  { type: "slug", value: "foo", existingSlug: "foo", source: "catalogue" },
];

test("decideLeadDestination : score >= seuil sans garde-fou → direct", () => {
  const d = decideLeadDestination({
    score: 85,
    autoPublishMinScore: 80,
    dedupMatches: [],
    invalidUrls: [],
  });
  assert.equal(d.destination, "direct");
  assert.equal(d.reason, "score_threshold");
});

test("decideLeadDestination : score sous seuil → draft", () => {
  const d = decideLeadDestination({
    score: 72,
    autoPublishMinScore: 80,
    dedupMatches: [],
    invalidUrls: [],
  });
  assert.equal(d.destination, "draft");
  assert.equal(d.reason, "below_threshold");
});

test("decideLeadDestination : doublon prime sur score élevé", () => {
  const d = decideLeadDestination({
    score: 95,
    autoPublishMinScore: 80,
    dedupMatches: dedupHit,
    invalidUrls: [],
  });
  assert.equal(d.destination, "draft");
  assert.equal(d.reason, "doublon");
});

test("decideLeadDestination : invalid_urls prime sur score élevé", () => {
  const d = decideLeadDestination({
    score: 95,
    autoPublishMinScore: 80,
    dedupMatches: [],
    invalidUrls: ["https://broken.example/"],
  });
  assert.equal(d.destination, "draft");
  assert.equal(d.reason, "invalid_urls");
});

test("decideLeadDestination : doublon prime sur invalid_urls", () => {
  const d = decideLeadDestination({
    score: 95,
    autoPublishMinScore: 80,
    dedupMatches: dedupHit,
    invalidUrls: ["https://broken.example/"],
  });
  assert.equal(d.destination, "draft");
  assert.equal(d.reason, "doublon");
});

test("assertAutoPublishMinScoreValid : rejette seuil auto < min pipeline", () => {
  assert.throws(
    () => assertAutoPublishMinScoreValid(70, 65),
    /Seuil auto-publication/
  );
});

test("assertAutoPublishMinScoreValid : accepte seuil auto >= min pipeline", () => {
  assert.doesNotThrow(() => assertAutoPublishMinScoreValid(65, 80));
});

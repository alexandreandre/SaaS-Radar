/**
 * Tests registre contenu — schémas canal et validation.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CONTENT_ASSET_SCHEMAS,
  getRequiredContentAssetIds,
  validateContentAsset,
  fieldsFromValues,
  isContentAssetConfirmed,
  contentAssetLabel,
} from "../src/lib/campaign/content-schemas";
import type { CampaignContentAsset } from "../src/lib/campaign/kits";

test("getRequiredContentAssetIds — landing + primary + 1er support", () => {
  const ids = getRequiredContentAssetIds("seo", ["referral", "google"]);
  assert.deepEqual(ids, ["landing", "seo", "referral"]);
});

test("getRequiredContentAssetIds — ignore support identique au primary", () => {
  const ids = getRequiredContentAssetIds("google", ["google", "referral"]);
  assert.deepEqual(ids, ["landing", "google", "referral"]);
});

test("CONTENT_ASSET_SCHEMAS — google respecte limites Ads", () => {
  const google = CONTENT_ASSET_SCHEMAS.google!;
  assert.equal(google.fields.find((f) => f.key === "headline1")?.maxLength, 30);
  assert.equal(google.fields.find((f) => f.key === "description1")?.maxLength, 90);
});

test("validateContentAsset — champs requis et maxLength", () => {
  const schema = CONTENT_ASSET_SCHEMAS.landing!;
  const empty: CampaignContentAsset = {
    id: "landing",
    channel: "landing",
    label: schema.label,
    fields: fieldsFromValues(schema, {}),
    source: "derived",
  };
  const invalid = validateContentAsset(empty);
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length > 0);

  const filled: CampaignContentAsset = {
    ...empty,
    fields: fieldsFromValues(schema, {
      h1: "Titre principal",
      subtitle: "Sous-titre accrocheur",
      bullet1: "Point 1",
      bullet2: "Point 2",
      bullet3: "Point 3",
      cta: "Essayer",
    }),
    confirmedAt: "2025-01-01",
  };
  assert.equal(validateContentAsset(filled).valid, true);
  assert.equal(isContentAssetConfirmed(filled), true);
});

test("contentAssetLabel — libellés humains", () => {
  assert.equal(contentAssetLabel("landing"), "Site / landing");
  assert.equal(contentAssetLabel("google"), "Google Ads");
});

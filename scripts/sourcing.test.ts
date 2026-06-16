/**
 * Tests unitaires (sans réseau) des fonctions pures du pipeline de sourcing.
 * Exécution : npm test  (node:test via tsx, aucune dépendance supplémentaire).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import { slugify, safeBaseSlug, getMinScore, meetsScoreGate, computeFactsScore, computeHybridOpportunityScore } from "../src/lib/sourcing/assemble";
import { passesUrlGate } from "../src/lib/sourcing/verify-sources";
import { hasBlockingDedup } from "../src/lib/admin/sourcing-dedup.shared";
import { matchesCountryQuery, enrichCountry, buildSearchableCountries } from "../src/lib/sourcing/country-search";
import { getSourcingCountryCatalog } from "../src/data/sourcing-country-catalog";
import { hasGeminiFixableError } from "../src/lib/sourcing/schema";
import { isCatalogueProfile } from "../src/lib/sourcing/pipeline-profile.shared";
import { mergeFavoriteSlugs } from "../src/lib/favorites.shared";
import type { Opportunity } from "../src/types/opportunity";

test("slugify normalise accents et caractères spéciaux", () => {
  assert.equal(slugify("Réservation Médecins !"), "reservation-medecins");
  assert.equal(slugify("  Hello   World  "), "hello-world");
  assert.equal(slugify("A&B / C"), "a-b-c");
});

test("safeBaseSlug retombe sur l'inspiration puis sur un fallback déterministe", () => {
  assert.equal(safeBaseSlug({ name: "Calendly FR", foreignInspiration: "Calendly" }), "calendly-fr");
  assert.equal(safeBaseSlug({ name: "  !! ", foreignInspiration: "Acme Tool" }), "acme-tool");

  const fallback = safeBaseSlug({ name: "###", foreignInspiration: "%%%" });
  assert.match(fallback, /^saas-[a-f0-9]{8}$/);
});

test("hasGeminiFixableError: erreur sur champ calculé seul -> false", () => {
  const slugError = z.object({ slug: z.string().min(5) }).safeParse({ slug: "x" });
  assert.equal(slugError.success, false);
  if (!slugError.success) {
    assert.equal(hasGeminiFixableError(slugError.error), false);
  }

  const scoresError = z.object({ scores: z.string() }).safeParse({ scores: 123 });
  if (!scoresError.success) {
    assert.equal(hasGeminiFixableError(scoresError.error), false);
  }
});

test("hasGeminiFixableError: erreur sur champ contrôlé par Gemini -> true", () => {
  const pitchError = z.object({ pitch: z.string().min(5) }).safeParse({ pitch: "x" });
  assert.equal(pitchError.success, false);
  if (!pitchError.success) {
    assert.equal(hasGeminiFixableError(pitchError.error), true);
  }
});

test("hasGeminiFixableError: erreurs mixtes (calculé + Gemini) -> true", () => {
  const mixed = z
    .object({ slug: z.string().min(5), pitch: z.string().min(5) })
    .safeParse({ slug: "x", pitch: "y" });
  if (!mixed.success) {
    assert.equal(hasGeminiFixableError(mixed.error), true);
  }
});

test("getMinScore lit et borne SOURCING_MIN_SCORE", () => {
  const original = process.env.SOURCING_MIN_SCORE;
  try {
    delete process.env.SOURCING_MIN_SCORE;
    assert.equal(getMinScore(), 0);

    process.env.SOURCING_MIN_SCORE = "65";
    assert.equal(getMinScore(), 65);

    process.env.SOURCING_MIN_SCORE = "9999";
    assert.equal(getMinScore(), 100);

    process.env.SOURCING_MIN_SCORE = "abc";
    assert.equal(getMinScore(), 0);

    process.env.SOURCING_MIN_SCORE = "-5";
    assert.equal(getMinScore(), 0);
  } finally {
    if (original === undefined) delete process.env.SOURCING_MIN_SCORE;
    else process.env.SOURCING_MIN_SCORE = original;
  }
});

test("meetsScoreGate compare scores.opportunity au seuil", () => {
  const opp = { scores: { opportunity: 70 } } as Opportunity;
  assert.equal(meetsScoreGate(opp, 65), true);
  assert.equal(meetsScoreGate(opp, 70), true);
  assert.equal(meetsScoreGate(opp, 71), false);
});

test("computeHybridOpportunityScore pondère faits et Gemini", () => {
  const sub = { franceFit: 8, buildability: 8, margin: 8, competitionGap: 8 };
  const facts = {
    sourceVerified: true,
    factConfidence: "high" as const,
    tractionCount: 2,
    techComplexity: "low",
    franceCompetition: "low",
  };
  const score = computeHybridOpportunityScore(sub, facts);
  assert.ok(score >= 70 && score <= 100);
});

test("passesUrlGate rejette si aucune URL valide", () => {
  assert.equal(
    passesUrlGate({
      verified: false,
      invalidUrls: ["https://x.com"],
      validCount: 0,
      totalCount: 1,
      verificationLevel: "none",
    }),
    false
  );
  assert.equal(
    passesUrlGate({
      verified: true,
      invalidUrls: [],
      validCount: 2,
      totalCount: 2,
      verificationLevel: "full",
    }),
    true
  );
});

test("hasBlockingDedup détecte slug et domain", () => {
  assert.equal(hasBlockingDedup([{ type: "slug", value: "foo" }]), true);
  assert.equal(hasBlockingDedup([{ type: "name_fuzzy", value: "bar" }]), false);
});

test("matchesCountryQuery trouve France via alias", () => {
  const fr = enrichCountry("FR", "France");
  assert.equal(matchesCountryQuery(fr, "france"), true);
  assert.equal(matchesCountryQuery(fr, "FR"), true);
  assert.equal(matchesCountryQuery(fr, "royaume"), false);
});

test("catalog ISO complet — france trouvable même si markets partiel", () => {
  const partial = [{ code: "US", name: "USA", flag: "🇺🇸" }];
  const base = getSourcingCountryCatalog();
  const merged = base.map((c) => {
    const o = partial.find((m) => m.code === c.code);
    return o ? { ...c, ...o } : c;
  });
  const searchable = buildSearchableCountries(merged);
  assert.equal(searchable.length, 250);
  assert.equal(
    searchable.some((c) => matchesCountryQuery(c, "france")),
    true
  );
});

test("isCatalogueProfile détecte le profil catalogue via option ou config", () => {
  assert.equal(isCatalogueProfile({ pipelineProfile: "catalogue" }), true);
  assert.equal(isCatalogueProfile({ config: { pipelineProfile: "catalogue" } }), true);
  assert.equal(isCatalogueProfile({ pipelineProfile: "standard" }), false);
  assert.equal(isCatalogueProfile({}), false);
});

test("mergeFavoriteSlugs déduplique et préserve l'ordre", () => {
  assert.deepEqual(mergeFavoriteSlugs(["a", "b"], ["b", "c"]), ["a", "b", "c"]);
  assert.deepEqual(mergeFavoriteSlugs([], ["x", "", "x"]), ["x"]);
});

/**
 * Tests unitaires (sans réseau) des fonctions pures du pipeline de sourcing.
 * Exécution : npm test  (node:test via tsx, aucune dépendance supplémentaire).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import { slugify, safeBaseSlug, getMinScore, meetsScoreGate, computeFactsScore, computeHybridOpportunityScore, normalizeLead } from "../src/lib/sourcing/assemble";
import { passesUrlGate } from "../src/lib/sourcing/verify-sources";
import { hasBlockingDedup } from "../src/lib/admin/sourcing-dedup.shared";
import { matchesCountryQuery, enrichCountry, buildSearchableCountries } from "../src/lib/sourcing/country-search";
import { getSourcingCountryCatalog } from "../src/data/sourcing-country-catalog";
import { hasGeminiFixableError } from "../src/lib/sourcing/schema";
import { isCatalogueProfile } from "../src/lib/sourcing/pipeline-profile.shared";
import { mergeFavoriteSlugs } from "../src/lib/favorites.shared";
import {
  assessTractionQuality,
  classifySignal,
  detectCountryMismatch,
  slotSignalsByCategory,
} from "../src/lib/sourcing/traction-quality";
import { mergeTractionSignals } from "../src/lib/sourcing/enrich-traction";
import { extractJsonObject } from "../src/lib/sourcing/openrouter";
import type { Opportunity } from "../src/types/opportunity";
import type { FactualLead } from "../src/lib/sourcing/schema";

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

const sampleLead = (overrides: Partial<FactualLead> = {}): FactualLead => ({
  name: "Deadline Reminder",
  pitch: "Rappels fiscaux pour freelancers",
  originCountry: "Royaume-Uni",
  originCountryCode: "GB",
  originFlag: "🇬🇧",
  sector: "finance",
  targetClient: "Freelancers",
  foreignInspiration: "Deadline Reminder (États-Unis) — rappels fiscaux",
  tractionSignals: [
    {
      label: "Mention dans un blog de comptable UK",
      value: "Un cabinet comptable UK recommande l'outil pour les TPE.",
      source: "Blog cabinet comptable UK",
      sourceUrl: "https://example.com/blog",
      kind: "narrative",
    },
  ],
  ...overrides,
});

test("classifySignal place un blog en autorité", () => {
  const signal = sampleLead().tractionSignals[0];
  assert.equal(classifySignal(signal), "authority");
});

test("slotSignalsByCategory évite de mettre l'autorité sous MRR", () => {
  const slotted = slotSignalsByCategory(sampleLead().tractionSignals);
  assert.equal(slotted.mrr, null);
  assert.equal(slotted.authority?.label, "Mention dans un blog de comptable UK");
  assert.equal(slotted.community, null);
});

test("assessTractionQuality détecte pays incohérent et catégories manquantes", () => {
  const report = assessTractionQuality(sampleLead());
  assert.equal(report.countryMismatch, true);
  assert.deepEqual(report.missing, ["mrr", "community"]);
  assert.equal(report.score < 60, true);
});

test("normalizeLead réécrit foreignInspiration avec originCountry", () => {
  const normalized = normalizeLead(sampleLead());
  assert.match(normalized.foreignInspiration, /Royaume-Uni/);
  assert.equal(normalized.foreignInspiration.includes("États-Unis"), false);
});

test("detectCountryMismatch compare les alias US/États-Unis", () => {
  assert.equal(
    detectCountryMismatch({
      foreignInspiration: "Tool (US) — test",
      originCountry: "États-Unis",
    }),
    false
  );
});

test("mergeTractionSignals déduplique et borne à 6 signaux", () => {
  const existing = sampleLead().tractionSignals;
  const found = [
    {
      label: "MRR estimé",
      value: "$18k",
      source: "GetLatka",
      sourceUrl: "https://getlatka.com/acme",
      kind: "metric" as const,
    },
    ...existing,
  ];
  const merged = mergeTractionSignals(existing, found);
  assert.equal(merged.length, 2);
  assert.equal(merged.some((s) => s.label === "MRR estimé"), true);
});

import {
  getCacForChannel,
  normalizeAcquisitionTitle,
  normalizeAcquisitionTabs,
} from "../src/lib/acquisition-channels";
import { CANONICAL_CAC } from "../src/lib/sourcing/constants";

test("normalizeAcquisitionTitle aligne les titres sur les canaux CAC canoniques", () => {
  assert.equal(normalizeAcquisitionTitle("Cold Email"), "Cold email");
  assert.equal(normalizeAcquisitionTitle("Partenariats locaux"), "Referral");
  assert.equal(normalizeAcquisitionTitle("LinkedIn"), "LinkedIn");
});

test("getCacForChannel résout le CAC après normalisation des titres", () => {
  const cac = getCacForChannel(CANONICAL_CAC, "Cold Email");
  assert.equal(cac?.estimate, 80);
  const referral = getCacForChannel(CANONICAL_CAC, "Partenariats locaux");
  assert.equal(referral?.estimate, 30);
});

test("normalizeAcquisitionTabs normalise tous les titres de canaux", () => {
  const tabs = normalizeAcquisitionTabs([
    { id: "a", title: "Cold Email", tactics: ["t1"] },
    { id: "b", title: "Partenariats locaux", tactics: ["t2"] },
  ]);
  assert.equal(tabs[0]?.title, "Cold email");
  assert.equal(tabs[1]?.title, "Referral");
});

test("extractJsonObject: tableau JSON racine", () => {
  const parsed = extractJsonObject('[{"name":"A"},{"name":"B"}]');
  assert.ok(Array.isArray(parsed));
  assert.equal((parsed as { name: string }[]).length, 2);
});

test("extractJsonObject: récupère des leads complets dans un JSON tronqué", () => {
  const truncated =
    '{"leads":[{"name":"Alpha","pitch":"p","url":"https://a.com","originCountry":"France","originCountryCode":"FR","originFlag":"🇫🇷","sector":"healthcare","targetClient":"t","foreignInspiration":"x","tractionSignals":[]},{"name":"Beta","pitch":"p2","url":"https://b.com","originCountry":"France","originCountryCode":"FR","originFlag":"🇫🇷","sector":"hr","targetClient":"t2","foreignInspiration":"y","tractionSignals":[{"label":"MRR","value":"$1k","source":"IH","sourceUrl":"https://ih.com","kind":"metric"}';
  const parsed = extractJsonObject(truncated) as { leads?: { name: string }[] };
  assert.equal(parsed.leads?.length, 1);
  assert.equal(parsed.leads?.[0]?.name, "Alpha");
});

test("extractJsonObject: message d'erreur explicite si vide", () => {
  assert.throws(() => extractJsonObject("   "), /vide/);
});

/**
 * Tests unitaires du profil infra Build (sans réseau).
 * Exécution : npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { opportunities } from "../src/data/opportunities";
import { enrichOpportunity } from "../src/data/opportunity-enrichment";
import {
  collectProductFeatures,
  getInfraProfile,
  isInfraRoadmapTask,
  shouldShowInfraCallout,
} from "../src/lib/build/infra-profile";
import { buildSetupGuideSteps } from "../src/lib/build/setup-guide";
import { validateBuildPrompt } from "../src/lib/build/prompt-quality";
import { parseSetupStep, parseSetupSteps } from "../src/lib/build/kit-content";
import { getBuildTool } from "../src/lib/build/tools";

const btpOpportunity = enrichOpportunity(
  opportunities.find((o) => o.slug === "quote-generator-contractors")!,
);

test("isInfraRoadmapTask détecte les tâches setup infra", () => {
  assert.equal(isInfraRoadmapTask("Initialisation du projet Next.js, Supabase, TailwindCSS"), true);
  assert.equal(isInfraRoadmapTask("Setup repo, auth, DB schema"), true);
  assert.equal(isInfraRoadmapTask("Mise en place de l'authentification (email/password)"), true);
  assert.equal(isInfraRoadmapTask("Développement du calculateur de tarif journalier"), false);
  assert.equal(isInfraRoadmapTask("Landing page FR"), false);
});

test("collectProductFeatures exclut les tâches infra roadmap", () => {
  const features = collectProductFeatures(btpOpportunity);
  assert.ok(features.some((f) => /devis|template/i.test(f)));
  assert.equal(
    features.some((f) => /initialisation|setup repo|auth,? db/i.test(f)),
    false,
  );
});

test("getInfraProfile cursor → recommended-stack avec env Supabase", () => {
  const cursor = getBuildTool("cursor")!;
  const profile = getInfraProfile(btpOpportunity, cursor);

  assert.equal(profile.mode, "recommended-stack");
  assert.equal(profile.primaryBackend, "supabase");
  assert.ok(profile.services.includes("auth"));
  assert.ok(profile.services.includes("database"));
  assert.ok(profile.envVars.some((v) => v.name === "NEXT_PUBLIC_SUPABASE_URL"));
  assert.match(profile.uiSummaryFr, /Supabase/i);
});

test("getInfraProfile lovable → managed sans env vars manuelles", () => {
  const lovable = getBuildTool("lovable")!;
  const profile = getInfraProfile(btpOpportunity, lovable);

  assert.equal(profile.mode, "managed");
  assert.equal(profile.envVars.length, 0);
  assert.equal(profile.setupSteps.length, 0);
  assert.match(profile.uiSummaryFr, /Lovable/i);
});

test("validateBuildPrompt détecte un prompt sans backend", () => {
  const cursor = getBuildTool("cursor")!;
  const profile = getInfraProfile(btpOpportunity, cursor);
  const weakPrompt =
    "Je suis un fondateur solo. Construisez mon MVP avec authentification et profils utilisateur. " +
    "Choisissez la stack la plus simple. Commencez par la structure du projet.";

  const result = validateBuildPrompt(weakPrompt, profile, cursor);
  assert.equal(result.ok, false);
  assert.ok(result.missing.some((m) => /supabase|backend|persistance/i.test(m)));
});

test("validateBuildPrompt accepte un prompt infra complet", () => {
  const cursor = getBuildTool("cursor")!;
  const profile = getInfraProfile(btpOpportunity, cursor);
  const strongPrompt = `
## Contexte produit
SubbieRates pour sous-traitants BTP.

## Architecture & stack recommandée
Next.js 14 App Router + Supabase (auth email/password + PostgreSQL + RLS).
Tables: profiles, rate_profiles, quotes avec politiques RLS par utilisateur.

## Authentification
Inscription et connexion email/mot de passe via Supabase Auth.

## Configuration & secrets
Créer .env.example avec NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY en placeholders.

## Fonctionnalités
1. Calculateur de tarif journalier
2. Sauvegarde des profils tarifaires
3. Génération de devis PDF
4. Tableau de bord historique

## UX
Testable en local et en production. Chaque écran doit gérer les états vides et les erreurs réseau.
Le parcours complet inscription connexion onboarding calcul devis export PDF doit être testable sans mock.
`.repeat(4);

  const result = validateBuildPrompt(strongPrompt, profile, cursor);
  assert.equal(result.ok, true);
  assert.equal(result.missing.length, 0);
});

test("buildSetupGuideSteps cursor — trame complète avec Supabase et test personnalisé", () => {
  const cursor = getBuildTool("cursor")!;
  const opp = btpOpportunity;
  const profile = getInfraProfile(opp, cursor);
  const steps = buildSetupGuideSteps({
    tool: cursor,
    productName: "SubbieRates",
    features: collectProductFeatures(opp),
    infraProfile: profile,
    language: "fr",
  });

  assert.ok(steps.length >= 5);
  assert.equal(steps[0]?.kind, "plan_mode");
  assert.equal(steps[1]?.kind, "infra");
  assert.ok(steps.some((s) => s.kind === "paste_prompt"));
  assert.ok(steps.some((s) => s.kind === "env"));
  const testStep = steps.find((s) => s.kind === "test");
  assert.ok(testStep?.body.includes("SubbieRates"));
  assert.ok(testStep?.body.includes("inscription"));
});

test("buildSetupGuideSteps lovable — sans étape .env manuelle", () => {
  const lovable = getBuildTool("lovable")!;
  const profile = getInfraProfile(btpOpportunity, lovable);
  const steps = buildSetupGuideSteps({
    tool: lovable,
    productName: "MonApp",
    features: collectProductFeatures(btpOpportunity),
    infraProfile: profile,
    language: "fr",
  });

  assert.equal(steps.some((s) => s.kind === "env"), false);
  assert.equal(steps.some((s) => s.kind === "infra"), false);
  assert.ok(steps.some((s) => s.kind === "paste_prompt"));
  assert.ok(steps.some((s) => s.title === "Mettre en ligne"));
});

test("shouldShowInfraCallout masque Lovable, affiche Cursor", () => {
  const lovable = getBuildTool("lovable")!;
  const cursor = getBuildTool("cursor")!;
  assert.equal(shouldShowInfraCallout(getInfraProfile(btpOpportunity, lovable)), false);
  assert.equal(shouldShowInfraCallout(getInfraProfile(btpOpportunity, cursor)), true);
});

test("parseSetupStep extrait titre et corps au format Titre : détail", () => {
  const step = parseSetupStep(
    "Mode plan : activer le mode plan dans Cursor (recommandé) — Shift+Tab dans le chat Agent",
  );
  assert.equal(step.kind, "plan_mode");
  assert.equal(step.title, "Mode plan");
  assert.match(step.body ?? "", /Shift\+Tab/i);
  assert.equal(step.recommended, true);
});

test("parseSetupSteps classe les étapes infra et test", () => {
  const steps = parseSetupSteps([
    "Supabase : créer un projet gratuit sur supabase.com et noter URL + clé anon",
    "Variables : copier .env.example en .env.local avec vos clés Supabase et Stripe",
    "Test local : inscription, calcul de tarif, génération de devis PDF",
  ]);
  assert.equal(steps[0]?.kind, "infra");
  assert.equal(steps[1]?.kind, "env");
  assert.equal(steps[2]?.kind, "test");
});

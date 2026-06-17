import { MODELS } from "./constants";
import { callOpenRouter, extractJsonObject, type CostTracker } from "./openrouter";
import type { FactualLead } from "./schema";

const GEMINI_SYSTEM = [
  "Tu es un analyste produit/go-to-market spécialiste de l'adaptation de MICRO-SaaS au marché français.",
  "Tu aides un développeur français SOLO à lancer un clone niche — pas à reproduire une plateforme US.",
  "Tu réponds STRICTEMENT par un objet JSON conforme au schéma demandé, sans aucune prose.",
].join(" ");

function buildPremiumBlock(): string {
  return [
    "",
    "MODE ENRICHI — ajoute EN PLUS ces 3 champs optionnels (sinon ne les inclus pas) :",
    JSON.stringify(
      {
        frenchCompetitors: [
          {
            name: "Concurrent FR",
            positioning: "Positionnement",
            pricing: "Tarif",
            strength: "Force",
            weakness: "Faiblesse",
          },
        ],
        launchTimeline: [
          { week: 1, goal: "Objectif S1", actions: ["Action 1"], kpi: "KPI S1" },
          { week: 2, goal: "Objectif S2", actions: ["Action 1"], kpi: "KPI S2" },
          { week: 3, goal: "Objectif S3", actions: ["Action 1"], kpi: "KPI S3" },
          { week: 4, goal: "Objectif S4", actions: ["Action 1"], kpi: "KPI S4" },
        ],
        emailTemplates: [
          { name: "Cold email 1", subject: "Objet", body: "Corps de l'email" },
        ],
      },
      null,
      0
    ),
    "- frenchCompetitors : 2-4 concurrents FR réels si tu en connais ; sinon OMETS le champ.",
    "- launchTimeline : EXACTEMENT 4 semaines (week 1 à 4).",
    "- emailTemplates : 1-3 templates de prospection FR concrets.",
    "- Ces champs sont OPTIONNELS : en cas de doute, OMETS-LES plutôt que d'inventer.",
  ].join("\n");
}

function buildStructurePrompt(
  lead: FactualLead,
  opts: { zodFeedback?: string; premium?: boolean } = {}
): string {
  const { zodFeedback } = opts;
  const correction = zodFeedback
    ? [
        "",
        "⚠️ Ta réponse précédente a échoué la validation. Corrige EXACTEMENT ces erreurs :",
        zodFeedback,
        "",
      ].join("\n")
    : "";
  const premiumBlock = buildPremiumBlock();

  return [
    "Voici un SaaS étranger (faits vérifiés) :",
    JSON.stringify(lead, null, 0),
    correction,
    "",
    "Produis l'analyse d'adaptation France sous forme d'UN objet JSON de cette forme EXACTE :",
    JSON.stringify(
      {
        clientType: "b2b | b2c",
        techComplexity: "low | medium | high",
        franceCompetition: "none | low | medium | high",
        boringBusiness: true,
        aiPowered: true,
        buildableUnder30Days: true,
        entrepreneursBuilding: 8,
        subScores: {
          franceFit: 8.2,
          buildability: 7.5,
          margin: 8.5,
          competitionGap: 8.8,
        },
        franceFitCriteria: {
          problemExists: true,
          regulation: "Contraintes réglementaires FR",
          competitors: "État de la concurrence FR",
          cultureFit: "Adéquation culturelle",
        },
        franceAnalysis: ["Point d'analyse 1", "Point d'analyse 2"],
        whyItWorks: [
          { fact: "Fait marquant", detail: "Explication chiffrée", source: "Source", sourceUrl: "https://..." },
        ],
        financialScenarios: [
          { name: "Prudent", clients: 8, avgPrice: 39, grossMargin: 82 },
          { name: "Réaliste", clients: 35, avgPrice: 59, grossMargin: 85 },
          { name: "Optimiste", clients: 80, avgPrice: 79, grossMargin: 88 },
        ],
        mvpPlan: {
          features: ["Feature 1", "Feature 2"],
          notYet: ["Hors scope V1"],
          stackExtras: ["Twilio", "OpenAI"],
          roadmap: [
            {
              day: "J1-3",
              week: 1,
              objective: "Repo prêt + auth fonctionnelle",
              tasks: ["Setup repo Next.js 14 App Router", "Auth Supabase email/password", "Schéma DB initial"],
              buildPrompt: "Prompt IA concret pour cette étape (copier-coller dans Claude Code)",
              checkpoint: "Un utilisateur peut s'inscrire et voir un dashboard vide",
              estimateHours: 8,
            },
            {
              day: "J4-10",
              week: 2,
              objective: "Workflow core MVP livré",
              tasks: ["Workflow principal end-to-end", "CRUD entités métier", "Tests manuels happy path"],
              buildPrompt: "Prompt IA pour le workflow core",
              checkpoint: "Le parcours principal fonctionne sans erreur bloquante",
              estimateHours: 16,
            },
            {
              day: "J11-20",
              week: 3,
              objective: "Monétisation + onboarding",
              tasks: ["Stripe checkout + webhooks", "Onboarding 3 étapes", "Emails transactionnels Resend"],
              buildPrompt: "Prompt IA pour Stripe et onboarding",
              checkpoint: "Un paiement test passe et l'utilisateur est guidé au premier usage",
              estimateHours: 14,
            },
            {
              day: "J21-30",
              week: 4,
              objective: "Landing + 5 bêtas",
              tasks: ["Landing page FR", "5 utilisateurs bêta onboardés", "Polish UX + fix bugs critiques"],
              buildPrompt: "Prompt IA pour landing et polish",
              checkpoint: "5 bêtas actifs + landing publique avec CTA waitlist ou signup",
              estimateHours: 12,
            },
          ],
          stackGuide: [
            {
              tool: "Next.js 14",
              role: "Frontend + API routes",
              why: "App Router, déploiement Vercel, écosystème React",
              setup: "npx create-next-app@latest --typescript --tailwind --app",
              freeTier: "Vercel Hobby gratuit",
              alternative: "Remix ou Nuxt si préférence",
            },
          ],
          pitfalls: ["Ne pas sur-dimensionner le MVP", "Valider le paiement tôt (J11 max)"],
          launchChecklist: [
            "Landing publique avec proposition de valeur claire",
            "Stripe en mode live ou test avec parcours complet",
            "5 bêtas ayant complété le workflow principal",
          ],
        },
        buildPrompts: {
          scaffold: "Prompt complet pour initialiser le repo (Next.js + Supabase + Stripe + shadcn)",
          features: [
            { feature: "Auth + dashboard", prompt: "Prompt pour auth Supabase et shell dashboard" },
            { feature: "Workflow core", prompt: "Prompt pour la feature métier principale" },
          ],
        },
        acquisition: [{ id: "cold-email", title: "Cold email", tactics: ["Tactique 1"] }],
        claudePrompt:
          "Prompt de build complet pour un MVP livrable en 30 jours par un solo dev (Next.js + Supabase + Stripe).",
        foreignMarketProfile: {
          productName: "Nom",
          country: "Pays",
          flag: "🇺🇸",
          tagline: "Accroche",
          problemSolved: "Problème résolu",
          targetUsers: "Utilisateurs cibles",
          businessModel: "Modèle économique",
          pricing: "Tarification",
          keyFeatures: ["Feature clé 1"],
          howItWorks: "Fonctionnement",
          whyItWorksThere: ["Raison du succès local"],
          tractionHighlights: [{ label: "MRR", value: "$42k", source: "GetLatka", sourceUrl: "https://..." }],
          franceAdaptation: ["Adaptation FR 1"],
        },
      },
      null,
      0
    ),
    "",
    "CONTRAINTES IMPÉRATIVES :",
    "- subScores : chacun entre 0 et 10. NE PRODUIS PAS de score 'opportunity' (il est calculé ailleurs).",
    "- buildableUnder30Days : évalue HONNÊTEMENT si un solo dev peut livrer le MVP France en ~30 jours.",
    "  Si le produit source est une plateforme trop large (suite complète, EHR, 50k+ users), mets false.",
    "- financialScenarios : projections pour un développeur français qui lance SEUL, sur 12-18 mois,",
    "  face à la concurrence FR — sois RÉALISTE, pas optimiste. NE calque PAS les revenus du SaaS US source.",
    "  EXACTEMENT 3 entrées : 'Prudent', 'Réaliste', 'Optimiste'. NE METS PAS de 'mrr' (recalculé ailleurs).",
    "  Plafonds indicatifs : Prudent 5-15 clients, Réaliste 25-50 clients, Optimiste MAX 80-120 clients (pas 500).",
    "  Prix FR réalistes : 29-99€/mois selon niche B2B.",
    "- COHÉRENCE 30 JOURS (si buildableUnder30Days = true) :",
    "  • mvpPlan.roadmap : 4 à 6 étapes sur J1 à J30 max (pas 90 jours, pas 2 mois).",
    "    Chaque étape DOIT inclure : day, week (1-4), objective (livrable concret), tasks (2-4 sous-tâches actionnables),",
    "    buildPrompt (prompt IA copier-coller pour CETTE étape uniquement, en français ou anglais technique),",
    "    checkpoint (critère de fin vérifiable), estimateHours (nombre réaliste pour solo dev).",
    "  • mvpPlan.stackGuide : une entrée par outil de la stack (tool, role, why, setup avec commande ou lien, freeTier, alternative).",
    "    Aligner avec Next.js, Supabase, Stripe, Tailwind, Resend quand pertinent.",
    "  • mvpPlan.pitfalls : 3-5 pièges classiques pour CE niche (éviter scope creep, etc.).",
    "  • mvpPlan.launchChecklist : 4-6 critères « definition of done » avant de considérer le lancement.",
    "  • buildPrompts : kit séquencé avec scaffold (prompt initialisation repo) + features (1 prompt par feature MVP, aligné sur mvpPlan.features).",
    "  • claudePrompt : prompt monolithique de secours (rétrocompat) — doit explicitement cadrer un MVP livrable en 30 jours par un solo dev.",
    "    Interdit de mentionner « 2 mois », « 90 jours », « quarter » pour le build.",
    "  • mvpPlan.features : périmètre MVP minimal (3-5 features max), pas une reproduction de la suite US.",
    "- clientType / techComplexity / franceCompetition : une des valeurs autorisées uniquement.",
    "- claudePrompt : un vrai prompt de build complet et exploitable, pas un résumé.",
    "- buildPrompts.buildPrompt par étape : prompts EXÉCUTABLES (fichiers à créer, stack, contraintes), pas des descriptions vagues.",
    "- ANCRAGE FAITS : ne contredis JAMAIS les faits du JSON lead fourni.",
    "  Si tu doutes, baisse les subScores et mets buildableUnder30Days=false.",
    "- foreignMarketProfile.tractionHighlights : reprends UNIQUEMENT les tractionSignals du lead (pas de nouveaux chiffres inventés).",
    "- foreignMarketProfile.keyFeatures : fonctionnalités du produit SUR LE MARCHÉ D'ORIGINE (3-5 items),",
    "  DISTINCTES de mvpPlan.features (périmètre MVP France). Ne recopie pas le roadmap FR.",
    "- Aucune prose hors de l'objet JSON.",
    premiumBlock,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Étape B — appelle Gemini et renvoie l'objet JSON brut (validé en aval par Zod). */
export async function structureLead(
  lead: FactualLead,
  tracker: CostTracker,
  opts: { zodFeedback?: string; premium?: boolean; model?: string } = {}
): Promise<unknown> {
  const { content, usage } = await callOpenRouter({
    model: opts.model ?? MODELS.structure,
    system: GEMINI_SYSTEM,
    user: buildStructurePrompt(lead, opts),
    // Gemini accepte json_object ; on force le JSON ici.
    responseFormat: { type: "json_object" },
  });
  tracker.add("Gemini", usage);
  return extractJsonObject(content);
}

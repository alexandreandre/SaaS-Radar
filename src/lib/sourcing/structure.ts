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
    "MODE PREMIUM ACTIVÉ — ajoute EN PLUS ces 3 champs optionnels (sinon ne les inclus pas) :",
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
  const { zodFeedback, premium } = opts;
  const correction = zodFeedback
    ? [
        "",
        "⚠️ Ta réponse précédente a échoué la validation. Corrige EXACTEMENT ces erreurs :",
        zodFeedback,
        "",
      ].join("\n")
    : "";
  const premiumBlock = premium ? buildPremiumBlock() : "";

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
            { day: "J1-3", tasks: ["Setup repo, auth, schéma DB"] },
            { day: "J4-10", tasks: ["Workflow core MVP"] },
            { day: "J11-20", tasks: ["Dashboard, Stripe, onboarding"] },
            { day: "J21-30", tasks: ["Landing, 5 bêtas, polish"] },
          ],
        },
        acquisition: [{ id: "cold-email", title: "Cold Email", tactics: ["Tactique 1"] }],
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
    "  • mvpPlan.roadmap : étapes sur J1 à J30 max (pas 90 jours, pas 2 mois).",
    "  • claudePrompt : doit explicitement cadrer un MVP livrable en 30 jours par un solo dev.",
    "    Interdit de mentionner « 2 mois », « 90 jours », « quarter » pour le build.",
    "  • mvpPlan.features : périmètre MVP minimal (3-5 features max), pas une reproduction de la suite US.",
    "- clientType / techComplexity / franceCompetition : une des valeurs autorisées uniquement.",
    "- claudePrompt : un vrai prompt de build complet et exploitable, pas un résumé.",
    "- ANCRAGE FAITS : ne contredis JAMAIS les faits du JSON lead fourni.",
    "  Si tu doutes, baisse les subScores et mets buildableUnder30Days=false.",
    "- foreignMarketProfile.tractionHighlights : reprends UNIQUEMENT les tractionSignals du lead (pas de nouveaux chiffres inventés).",
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

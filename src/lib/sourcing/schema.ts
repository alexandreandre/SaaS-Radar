import { z } from "zod";
import { normalizeWhyItWorksItem } from "@/types/opportunity";
import {
  SECTORS,
  CLIENT_TYPES,
  TECH_COMPLEXITY,
  FRANCE_COMPETITION,
  MAPPABLE_STACK_PATTERNS,
  MAPPABLE_CHANNEL_PATTERNS,
} from "./constants";

export const sectorEnum = z.enum(SECTORS);
export const clientTypeEnum = z.enum(CLIENT_TYPES);
export const techComplexityEnum = z.enum(TECH_COMPLEXITY);
export const franceCompetitionEnum = z.enum(FRANCE_COMPETITION);

const SCENARIO_NAMES = ["Prudent", "Réaliste", "Optimiste"] as const;

// ── Étape A : sortie Sonar (faits vérifiables) ───────────────────────────────
export const tractionSignalSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  source: z.string().min(1),
  // Conservatisme : chaque signal DOIT avoir une sourceUrl réelle (forme validée ici).
  sourceUrl: z.string().url(),
  kind: z.enum(["metric", "narrative"]).optional(),
});

export const factualLeadSchema = z.object({
  name: z.string().min(1),
  pitch: z.string().min(1),
  url: z.string().url().optional(),
  originCountry: z.string().min(1),
  originCountryCode: z.string().min(2).max(2),
  originFlag: z.string().min(1),
  sector: sectorEnum,
  targetClient: z.string().min(1),
  foreignInspiration: z.string().min(1),
  tractionSignals: z.array(tractionSignalSchema).min(1),
});

export type FactualLead = z.infer<typeof factualLeadSchema>;

// ── Briques partagées ────────────────────────────────────────────────────────
export const whyItWorksStructuredItemSchema = z.object({
  fact: z.string().min(1),
  detail: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

export const whyItWorksItemSchema = z.union([
  z.string().min(1),
  whyItWorksStructuredItemSchema,
]);

export const whyItWorksNormalizedSchema = z
  .array(whyItWorksItemSchema)
  .min(1)
  .transform((items) => items.map(normalizeWhyItWorksItem));

const tractionHighlightSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});

export const foreignMarketProfileSchema = z.object({
  productName: z.string().min(1),
  country: z.string().min(1),
  flag: z.string().min(1),
  tagline: z.string().min(1),
  problemSolved: z.string().min(1),
  targetUsers: z.string().min(1),
  businessModel: z.string().min(1),
  pricing: z.string().min(1),
  keyFeatures: z.array(z.string().min(1)).min(1),
  howItWorks: z.string().min(1),
  whyItWorksThere: z.array(z.string().min(1)).min(1),
  tractionHighlights: z.array(tractionHighlightSchema).min(1),
  franceAdaptation: z.array(z.string().min(1)).optional(),
});

const roadmapStepSchema = z.object({
  day: z.string().min(1),
  tasks: z.array(z.string().min(1)).min(1),
  week: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  objective: z.string().min(1).optional(),
  buildPrompt: z.string().min(1).optional(),
  checkpoint: z.string().min(1).optional(),
  estimateHours: z.number().positive().optional(),
});

const stackGuideEntrySchema = z.object({
  tool: z.string().min(1),
  role: z.string().min(1),
  why: z.string().min(1),
  setup: z.string().min(1),
  freeTier: z.string().min(1).optional(),
  alternative: z.string().min(1).optional(),
});

const buildFeaturePromptSchema = z.object({
  feature: z.string().min(1),
  prompt: z.string().min(1),
});

const buildPromptsSchema = z.object({
  scaffold: z.string().min(1),
  features: z.array(buildFeaturePromptSchema).min(1),
});

const mvpPlanAnalyticalSchema = z.object({
  features: z.array(z.string().min(1)).min(1),
  notYet: z.array(z.string().min(1)),
  stackExtras: z.array(z.string().min(1)).optional().default([]),
  roadmap: z.array(roadmapStepSchema).min(1),
  stackGuide: z.array(stackGuideEntrySchema).min(1).optional(),
  pitfalls: z.array(z.string().min(1)).min(1).optional(),
  launchChecklist: z.array(z.string().min(1)).min(1).optional(),
});

const acquisitionTabSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  tactics: z.array(z.string().min(1)).min(1),
});

// ── Champs enrichis (optionnels) — demandés à chaque génération ───────────────
// Doivent rester optionnels : si Gemini ne les produit pas, enrichOpportunity()
// fournit le fallback au runtime sans invalider la fiche.
const frenchCompetitorSchema = z.object({
  name: z.string().min(1),
  positioning: z.string().min(1),
  pricing: z.string().min(1),
  strength: z.string().min(1),
  weakness: z.string().min(1),
});

const launchWeekSchema = z.object({
  week: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  goal: z.string().min(1),
  actions: z.array(z.string().min(1)).min(1),
  kpi: z.string().min(1),
});

const emailTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

const franceFitCriteriaSchema = z.object({
  problemExists: z.boolean(),
  regulation: z.string().min(1),
  competitors: z.string().min(1),
  cultureFit: z.string().min(1),
});

// Scénario généré par Gemini : SANS mrr (recalculé par le code).
const scenarioInputSchema = z.object({
  name: z.enum(SCENARIO_NAMES),
  clients: z.number().int().positive(),
  avgPrice: z.number().positive(),
  grossMargin: z.number().min(0).max(100),
});

// ── Étape B : sortie Gemini (analyse structurante) ───────────────────────────
export const analyticalSchema = z.object({
  clientType: clientTypeEnum,
  techComplexity: techComplexityEnum,
  franceCompetition: franceCompetitionEnum,
  boringBusiness: z.boolean(),
  aiPowered: z.boolean(),
  /** Évalué honnêtement par Gemini : MVP France buildable par un solo dev en ~30 jours ? */
  buildableUnder30Days: z.boolean(),
  entrepreneursBuilding: z.number().int().min(0),
  // Gemini NE produit PAS scores.opportunity (calculé par le code).
  subScores: z.object({
    franceFit: z.number().min(0).max(10),
    buildability: z.number().min(0).max(10),
    margin: z.number().min(0).max(10),
    competitionGap: z.number().min(0).max(10),
  }),
  franceFitCriteria: franceFitCriteriaSchema,
  franceAnalysis: z.array(z.string().min(1)).min(1),
  whyItWorks: whyItWorksNormalizedSchema,
  financialScenarios: z.array(scenarioInputSchema).length(3),
  mvpPlan: mvpPlanAnalyticalSchema,
  acquisition: z.array(acquisitionTabSchema).min(1),
  claudePrompt: z.string().min(1),
  buildPrompts: buildPromptsSchema.optional(),
  foreignMarketProfile: foreignMarketProfileSchema,
  // Champs enrichis (optionnels) — présents seulement si Gemini les a produits valides.
  frenchCompetitors: z.array(frenchCompetitorSchema).min(1).optional(),
  launchTimeline: z.array(launchWeekSchema).length(4).optional(),
  emailTemplates: z.array(emailTemplateSchema).min(1).optional(),
});

export type AnalyticalData = z.infer<typeof analyticalSchema>;

// ── Étape C : raw Opportunity assemblé (autorité de validation finale) ────────
export const scoresSchema = z.object({
  opportunity: z.number().min(0).max(100),
  franceFit: z.number().min(0).max(10),
  buildability: z.number().min(0).max(10),
  margin: z.number().min(0).max(10),
  competitionGap: z.number().min(0).max(10),
});

const financialScenarioSchema = scenarioInputSchema
  .extend({ mrr: z.number().nonnegative() })
  .refine((s) => s.mrr === Math.round(s.clients * s.avgPrice), {
    message: "mrr doit être égal à Math.round(clients * avgPrice)",
    path: ["mrr"],
  });

const cacChannelSchema = z.object({
  channel: z.string().min(1),
  estimate: z.number().nonnegative(),
  note: z.string(),
});

const mvpPlanSchema = z.object({
  features: z.array(z.string().min(1)).min(1),
  notYet: z.array(z.string()),
  stack: z.array(z.string().min(1)).min(1),
  roadmap: z.array(roadmapStepSchema).min(1),
  stackGuide: z.array(stackGuideEntrySchema).min(1).optional(),
  pitfalls: z.array(z.string().min(1)).min(1).optional(),
  launchChecklist: z.array(z.string().min(1)).min(1).optional(),
});

function hasMappableStack(stack: string[]): boolean {
  return stack.some((item) =>
    MAPPABLE_STACK_PATTERNS.some((p) => item.toLowerCase().includes(p))
  );
}

function hasMappableChannel(channels: { channel: string }[]): boolean {
  return channels.some((c) =>
    MAPPABLE_CHANNEL_PATTERNS.some((p) => c.channel.toLowerCase().includes(p))
  );
}

export const opportunityRawSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug invalide (kebab-case attendu)"),
    name: z.string().min(1),
    pitch: z.string().min(1),
    originCountry: z.string().min(1),
    originCountryCode: z.string().min(2),
    originFlag: z.string().min(1),
    sector: sectorEnum,
    targetClient: z.string().min(1),
    clientType: clientTypeEnum,
    techComplexity: techComplexityEnum,
    franceCompetition: franceCompetitionEnum,
    revenueMin: z.number().int().nonnegative(),
    revenueMax: z.number().int().nonnegative(),
    buildableUnder30Days: z.boolean(),
    boringBusiness: z.boolean(),
    aiPowered: z.boolean(),
    lowCompetition: z.boolean(),
    scores: scoresSchema,
    franceFitCriteria: franceFitCriteriaSchema,
    tractionSignals: z.array(tractionSignalSchema).min(1),
    whyItWorks: whyItWorksNormalizedSchema,
    franceAnalysis: z.array(z.string().min(1)).min(1),
    financialScenarios: z.array(financialScenarioSchema).length(3),
    cacChannels: z.array(cacChannelSchema).min(1),
    mvpPlan: mvpPlanSchema,
    claudePrompt: z.string().min(1),
    buildPrompts: buildPromptsSchema.optional(),
    acquisition: z.array(acquisitionTabSchema).min(1),
    entrepreneursBuilding: z.number().int().min(0),
    foreignInspiration: z.string().min(1),
    url: z.string().url().optional(),
    foreignMarketProfile: foreignMarketProfileSchema.optional(),
    createdAt: z.string().min(1),
  })
  .superRefine((o, ctx) => {
    if (o.revenueMax < o.revenueMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "revenueMax doit être >= revenueMin",
        path: ["revenueMax"],
      });
    }
    if (!hasMappableStack(o.mvpPlan.stack)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `mvpPlan.stack ne contient aucune techno mappable (${MAPPABLE_STACK_PATTERNS.join(", ")})`,
        path: ["mvpPlan", "stack"],
      });
    }
    if (!hasMappableChannel(o.cacChannels)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `cacChannels ne contient aucun canal mappable (${MAPPABLE_CHANNEL_PATTERNS.join(", ")})`,
        path: ["cacChannels"],
      });
    }
    const names = o.financialScenarios.map((s) => s.name);
    for (const required of SCENARIO_NAMES) {
      if (!names.includes(required)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `financialScenarios doit contenir le scénario "${required}"`,
          path: ["financialScenarios"],
        });
      }
    }
  });

export type OpportunityRaw = z.infer<typeof opportunityRawSchema>;

/** Formate une erreur Zod en une ligne lisible (réinjectée dans le retry Gemini). */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "(racine)"}: ${i.message}`)
    .join(" | ");
}

/**
 * Champs de premier niveau d'une Opportunity CALCULÉS par assembleOpportunity (côté code),
 * que Gemini ne contrôle pas. Une erreur opportunityRawSchema portant exclusivement sur
 * ces chemins ne doit JAMAIS déclencher de retry Gemini (re-prompt inutile + coûteux).
 */
const CODE_COMPUTED_FIELDS = new Set([
  "id",
  "slug",
  "scores", // scores.opportunity calculé ; sous-scores viennent d'analyticalSchema mais le refine global est code
  "revenueMin",
  "revenueMax",
  "lowCompetition",
  "cacChannels",
  "createdAt",
  "financialScenarios", // mrr injecté par le code + refine
]);

/**
 * Indique si AU MOINS une erreur Zod porte sur un champ que Gemini contrôle réellement
 * (donc qu'un retry avec feedback peut corriger). Si toutes les erreurs portent sur des
 * champs calculés côté code, retourne false → on log et on skip plutôt que de re-prompter.
 */
export function hasGeminiFixableError(error: z.ZodError): boolean {
  return error.issues.some((issue) => {
    const root = issue.path[0];
    if (typeof root !== "string") return true; // erreur racine : potentiellement corrigeable
    return !CODE_COMPUTED_FIELDS.has(root);
  });
}

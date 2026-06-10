import { z } from "zod";
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
export const whyItWorksItemSchema = z.union([
  z.string().min(1),
  z.object({
    fact: z.string().min(1),
    detail: z.string().optional(),
    source: z.string().optional(),
    sourceUrl: z.string().url().optional(),
  }),
]);

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
});

const acquisitionTabSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  tactics: z.array(z.string().min(1)).min(1),
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
  whyItWorks: z.array(whyItWorksItemSchema).min(1),
  financialScenarios: z.array(scenarioInputSchema).length(3),
  mvpPlan: z.object({
    features: z.array(z.string().min(1)).min(1),
    notYet: z.array(z.string().min(1)),
    stackExtras: z.array(z.string().min(1)).optional().default([]),
    roadmap: z.array(roadmapStepSchema).min(1),
  }),
  acquisition: z.array(acquisitionTabSchema).min(1),
  claudePrompt: z.string().min(1),
  foreignMarketProfile: foreignMarketProfileSchema,
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
    whyItWorks: z.array(whyItWorksItemSchema).min(1),
    franceAnalysis: z.array(z.string().min(1)).min(1),
    financialScenarios: z.array(financialScenarioSchema).length(3),
    cacChannels: z.array(cacChannelSchema).min(1),
    mvpPlan: mvpPlanSchema,
    claudePrompt: z.string().min(1),
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

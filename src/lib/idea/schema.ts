import { z } from "zod";

export const ideaClarifyTurnSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const ideaDraftSchema = z.object({
  initialIdea: z.string().min(8).max(2000),
  turns: z.array(ideaClarifyTurnSchema).max(3),
  summary: z.string().optional(),
});

export const clarifyResponseSchema = z.object({
  clarityScore: z.number().min(0).max(100),
  missingDimensions: z.array(
    z.enum(["cible", "problème", "monétisation", "différenciation"]),
  ),
  question: z.string().optional(),
  suggestions: z.array(z.string().min(1).max(80)).max(4).optional(),
  summary: z.string().optional(),
});

export type ClarifyResponseParsed = z.infer<typeof clarifyResponseSchema>;

const frenchCompetitorSchema = z.object({
  name: z.string(),
  positioning: z.string(),
  pricing: z.string(),
  strength: z.string(),
  weakness: z.string(),
});

const financialScenarioSchema = z.object({
  name: z.enum(["Prudent", "Réaliste", "Optimiste"]),
  clients: z.number(),
  avgPrice: z.number(),
  mrr: z.number(),
  grossMargin: z.number(),
});

const whyItWorksSchema = z.object({
  fact: z.string(),
  detail: z.string().optional(),
});

export const ideaBriefSchema = z.object({
  identity: z.object({
    name: z.string().min(2),
    pitch: z.string().min(10),
    targetClient: z.string().min(3),
    clientType: z.enum(["b2b", "b2c"]),
    sector: z.enum([
      "healthcare",
      "construction",
      "hr",
      "finance",
      "legal",
      "retail",
      "education",
      "hospitality",
    ]),
  }),
  problem: z.object({
    statement: z.string().min(10),
    whyNowFrance: z.string().min(10),
  }),
  businessModel: z.object({
    pricing: z.string().min(3),
    tiers: z.array(z.string()).min(1).max(4),
    valueLogic: z.string().min(10),
  }),
  competition: z.object({
    competitors: z.array(frenchCompetitorSchema).min(1).max(5),
    positioningGap: z.string().min(10),
  }),
  marketFit: z.object({
    regulation: z.string().min(3),
    cultureFit: z.string().min(3),
    tam: z.string().min(2),
    sam: z.string().min(2),
    som: z.string().min(2),
    analysis: z.array(z.string()).min(2).max(6),
  }),
  franceFitCriteria: z.object({
    problemExists: z.boolean(),
    regulation: z.string(),
    competitors: z.string(),
    cultureFit: z.string(),
  }),
  whyItWorks: z.array(whyItWorksSchema).min(3).max(5),
  financials: z.array(financialScenarioSchema).length(3),
  acquisition: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        tactics: z.array(z.string()).min(2),
      }),
    )
    .min(2)
    .max(4),
  cacChannels: z
    .array(
      z.object({
        channel: z.string(),
        estimate: z.number(),
        note: z.string(),
      }),
    )
    .min(2)
    .max(5),
  mvpPlan: z.object({
    features: z.array(z.string()).min(3).max(8),
    notYet: z.array(z.string()).min(2).max(6),
    stack: z.array(z.string()).min(3).max(8),
    roadmap: z
      .array(
        z.object({
          day: z.string(),
          tasks: z.array(z.string()).min(1),
          objective: z.string().optional(),
        }),
      )
      .min(3)
      .max(6),
  }),
  scores: z.object({
    opportunity: z.number().min(0).max(100),
    franceFit: z.number().min(0).max(10),
    buildability: z.number().min(0).max(10),
    margin: z.number().min(0).max(10),
    competitionGap: z.number().min(0).max(10),
  }),
});

import { z } from "zod";

const projectPhaseSchema = z.enum(["build", "launch", "revenue", "paused"]);
const targetScenarioSchema = z.enum(["Prudent", "Réaliste", "Optimiste"]);

/** Schéma minimal pour PUT /api/portfolio/metrics — le payload complet vit dans `payload`. */
export const portfolioMetricsBodySchema = z
  .object({
    id: z.string().min(1),
    opportunitySlug: z.string().optional(),
    phase: projectPhaseSchema,
    currentMrr: z.number().min(0),
    targetScenario: targetScenarioSchema.optional(),
    ideaBrief: z.unknown().optional(),
    projectSource: z.enum(["idea", "github", "catalog", "opportunity"]).optional(),
  })
  .passthrough()
  .refine(
    (data) =>
      data.ideaBrief != null ||
      data.projectSource === "idea" ||
      data.projectSource === "github" ||
      Boolean(data.opportunitySlug?.trim()),
    { message: "opportunitySlug requis hors projet idée/github" },
  );

import type { Opportunity } from "@/types/opportunity";

/** Heuristique légère : concurrents FR avec nom + pricing = probablement vérifié. */
export function verifyPremiumFields(opportunity: Opportunity): boolean {
  const competitors = opportunity.frenchCompetitors;
  if (!competitors?.length) return true;
  const valid = competitors.filter(
    (c) => c.name?.length > 2 && c.positioning?.length > 5 && c.pricing?.length > 2
  );
  return valid.length >= Math.min(2, competitors.length);
}

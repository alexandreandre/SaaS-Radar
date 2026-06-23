import "server-only";

import type { Opportunity } from "@/types/opportunity";
import {
  getEnrichedOpportunityBySlug,
  getEnrichedOpportunityBySlugIncludingArchived,
} from "@/lib/opportunities";
import { resolveCockpitOpportunity } from "@/lib/idea/to-opportunity";
import { loadUserProject } from "@/lib/portfolio-sync";

export async function resolveCampaignOpportunity(
  userId: string,
  opportunitySlug: string,
  projectId: string,
): Promise<Opportunity | null> {
  let catalog = opportunitySlug ? await getEnrichedOpportunityBySlug(opportunitySlug) : null;

  if (!projectId) {
    return catalog;
  }

  const project = await loadUserProject(userId, projectId);
  if (!project) return catalog;

  if (!catalog && opportunitySlug) {
    catalog = await getEnrichedOpportunityBySlugIncludingArchived(opportunitySlug);
  }

  return resolveCockpitOpportunity(project, catalog);
}

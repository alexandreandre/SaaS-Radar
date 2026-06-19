import { notFound } from "next/navigation";
import { getEnrichedOpportunityBySlug } from "@/lib/opportunities";
import { getCurrentUser, getTier } from "@/lib/auth";
import { gateOpportunityForTier } from "@/lib/opportunity-access";
import { loadUserProjects } from "@/lib/portfolio-sync";
import { OpportunityDetail } from "@/components/opportunities/opportunity-detail";

export const dynamic = "force-dynamic";

export default async function OpportunityPage({ params }: { params: { slug: string } }) {
  const [opportunity, tier, user] = await Promise.all([
    getEnrichedOpportunityBySlug(params.slug),
    getTier(),
    getCurrentUser(),
  ]);
  if (!opportunity) notFound();

  let existingProjectId: string | null = null;
  if (user) {
    const projects = await loadUserProjects(user.id);
    existingProjectId = projects.find((p) => p.opportunitySlug === params.slug)?.id ?? null;
  }

  const gated = gateOpportunityForTier(opportunity, tier);
  return (
    <OpportunityDetail opportunity={gated} existingProjectId={existingProjectId} />
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const o = await getEnrichedOpportunityBySlug(params.slug);
  if (!o) return { title: "Opportunité introuvable" };
  return {
    title: `${o.name} — SaaS Radar`,
    description: o.pitch,
  };
}

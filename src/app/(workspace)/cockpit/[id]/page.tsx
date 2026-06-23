import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getTier } from "@/lib/auth";
import { getEnrichedOpportunityBySlugIncludingArchived } from "@/lib/opportunities";
import { gateOpportunityForTier } from "@/lib/opportunity-access";
import { loadUserProject } from "@/lib/portfolio-sync";
import { migrateProject } from "@/lib/portfolio";
import { CockpitPageClient } from "./cockpit-client";
import { CockpitModuleSkeleton } from "@/components/cockpit/cockpit-module-skeleton";

export const dynamic = "force-dynamic";

export default async function CockpitPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/cockpit/${params.id}`)}`);
  }

  const project = await loadUserProject(user.id, params.id);
  if (!project) notFound();

  const migrated = migrateProject(project);
  let initialOpportunity = null;
  if (migrated.opportunitySlug) {
    const raw = await getEnrichedOpportunityBySlugIncludingArchived(migrated.opportunitySlug);
    if (raw) {
      const tier = await getTier();
      initialOpportunity = gateOpportunityForTier(raw, tier);
    }
  }

  return (
    <Suspense fallback={<CockpitModuleSkeleton />}>
      <CockpitPageClient
        projectId={params.id}
        initialProject={migrated}
        initialOpportunity={initialOpportunity}
      />
    </Suspense>
  );
}

import { notFound } from "next/navigation";
import { getAllOpportunities, getEnrichedOpportunityBySlug } from "@/lib/opportunities";
import { OpportunityDetail } from "@/components/opportunities/opportunity-detail";

export async function generateStaticParams() {
  const opportunities = await getAllOpportunities();
  return opportunities.map((o) => ({ slug: o.slug }));
}

export default async function OpportunityPage({ params }: { params: { slug: string } }) {
  const opportunity = await getEnrichedOpportunityBySlug(params.slug);
  if (!opportunity) notFound();
  return <OpportunityDetail opportunity={opportunity} />;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const o = await getEnrichedOpportunityBySlug(params.slug);
  if (!o) return { title: "Opportunité introuvable" };
  return {
    title: `${o.name} — SaaS Radar`,
    description: o.pitch,
  };
}

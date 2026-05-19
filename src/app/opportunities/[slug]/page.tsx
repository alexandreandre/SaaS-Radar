import { notFound } from "next/navigation";
import { getOpportunityBySlug, opportunities } from "@/data/opportunities";
import { OpportunityDetail } from "@/components/opportunities/opportunity-detail";

export function generateStaticParams() {
  return opportunities.map((o) => ({ slug: o.slug }));
}

export default function OpportunityPage({ params }: { params: { slug: string } }) {
  const opportunity = getOpportunityBySlug(params.slug);
  if (!opportunity) notFound();
  return <OpportunityDetail opportunity={opportunity} />;
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const o = getOpportunityBySlug(params.slug);
  if (!o) return { title: "Opportunité introuvable" };
  return {
    title: `${o.name} — SaaS Radar`,
    description: o.pitch,
  };
}

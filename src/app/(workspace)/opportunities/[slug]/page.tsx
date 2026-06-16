import { notFound } from "next/navigation";
import { getEnrichedOpportunityBySlug } from "@/lib/opportunities";
import { getTier } from "@/lib/auth";
import { gateOpportunityForTier } from "@/lib/opportunity-access";
import { OpportunityDetail } from "@/components/opportunities/opportunity-detail";

// Le contenu depend du tier de l'utilisateur (strip premium serveur, lecture cookies)
// -> rendu dynamique par requete. Pas de prerendu statique possible.
export const dynamic = "force-dynamic";

export default async function OpportunityPage({ params }: { params: { slug: string } }) {
  const [opportunity, tier] = await Promise.all([
    getEnrichedOpportunityBySlug(params.slug),
    getTier(),
  ]);
  if (!opportunity) notFound();
  // SECURITE : on retire les champs premium hors tier AVANT de serialiser vers le client.
  const gated = gateOpportunityForTier(opportunity, tier);
  return <OpportunityDetail opportunity={gated} />;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const o = await getEnrichedOpportunityBySlug(params.slug);
  if (!o) return { title: "Opportunité introuvable" };
  return {
    title: `${o.name} — SaaS Radar`,
    description: o.pitch,
  };
}

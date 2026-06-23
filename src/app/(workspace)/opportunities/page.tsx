import { getOpportunityListItems } from "@/lib/opportunities";
import { isDiscoveryPhase } from "@/lib/product-phase";
import { OpportunitiesClient } from "./opportunities-client";

export const revalidate = 3600;

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunityListItems();

  return (
    <OpportunitiesClient opportunities={opportunities} discovery={isDiscoveryPhase()} />
  );
}

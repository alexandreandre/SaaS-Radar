import { getOpportunityListItems } from "@/lib/opportunities";
import { OpportunitiesClient } from "./opportunities-client";

export const revalidate = 3600;

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunityListItems();

  return <OpportunitiesClient opportunities={opportunities} />;
}

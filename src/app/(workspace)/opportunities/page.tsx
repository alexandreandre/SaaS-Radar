import { getAllOpportunities } from "@/lib/opportunities";
import { OpportunitiesClient } from "./opportunities-client";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const opportunities = await getAllOpportunities();

  return <OpportunitiesClient opportunities={opportunities} />;
}

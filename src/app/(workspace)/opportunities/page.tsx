import { getAllOpportunities, getDealOfTheDay } from "@/lib/opportunities";
import { OpportunitiesClient } from "./opportunities-client";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const [opportunities, dealOfDay] = await Promise.all([
    getAllOpportunities(),
    getDealOfTheDay(),
  ]);

  return <OpportunitiesClient opportunities={opportunities} dealOfDay={dealOfDay} />;
}

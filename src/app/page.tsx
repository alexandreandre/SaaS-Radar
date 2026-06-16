import { getGlobalStats } from "@/data/world-markets";
import { getAllOpportunities, getMapCatalog } from "@/lib/opportunities";
import { Footer } from "@/components/layout/footer";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { HomeFeedSection } from "@/components/home/home-feed-section";
import { HomeStaticSections } from "@/components/home/home-static-sections";

// ISR : la home reflète le catalogue Supabase, régénérée toutes les heures et à la
// demande via /api/revalidate (revalidatePath("/")) après chaque run de sourcing.
export const revalidate = 3600;

export default async function HomePage() {
  const mapStats = getGlobalStats();
  const [opportunities, mapCatalog] = await Promise.all([
    getAllOpportunities(),
    getMapCatalog(),
  ]);

  return (
    <>
      <link
        rel="preload"
        href="/geo/countries-110m.json"
        as="fetch"
        crossOrigin="anonymous"
      />
      <HomeHeroSection
        mapStats={{
          countriesTracked: mapStats.countriesTracked,
          totalMicroSaas: mapStats.totalMicroSaas,
          hottestMarket: {
            flag: mapStats.hottestMarket.flag,
            name: mapStats.hottestMarket.name,
          },
        }}
        mapCatalog={mapCatalog}
      />
      <HomeFeedSection opportunities={opportunities} />
      <HomeStaticSections />
      <Footer />
    </>
  );
}

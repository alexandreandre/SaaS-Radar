import { getGlobalStats } from "@/data/world-markets";
import { Footer } from "@/components/layout/footer";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { HomeFeedSection } from "@/components/home/home-feed-section";
import { HomeStaticSections } from "@/components/home/home-static-sections";

export default function HomePage() {
  const mapStats = getGlobalStats();

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
      />
      <HomeFeedSection />
      <HomeStaticSections />
      <Footer />
    </>
  );
}

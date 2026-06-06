"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { HomeMapGateway } from "@/components/world/home-map-gateway";
import { MAP_EXPLORE_QUERY, MAP_EXPLORE_VALUE } from "@/lib/map-routes";
import { cn } from "@/lib/utils";

export type HomeMapStats = {
  countriesTracked: number;
  totalMicroSaas: number;
  hottestMarket: { flag: string; name: string };
};

function HomeHeroInner({ mapStats }: { mapStats: HomeMapStats }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mapUnlocked, setMapUnlocked] = useState(false);

  const exploreParam = searchParams.get(MAP_EXPLORE_QUERY);

  useEffect(() => {
    const explore = exploreParam === MAP_EXPLORE_VALUE;
    setMapUnlocked(explore);
    if (explore) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [exploreParam]);

  const handleMapUnlock = useCallback(() => {
    setMapUnlocked(true);
    if (exploreParam !== MAP_EXPLORE_VALUE) {
      router.replace(`/?${MAP_EXPLORE_QUERY}=${MAP_EXPLORE_VALUE}`, { scroll: false });
    }
  }, [exploreParam, router]);

  const handleMapLock = useCallback(() => {
    setMapUnlocked(false);
    if (exploreParam === MAP_EXPLORE_VALUE) {
      router.replace("/", { scroll: false });
    }
  }, [exploreParam, router]);

  return (
    <section className="relative min-h-[min(100dvh,920px)] overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 z-0 radar-grid opacity-30" />
      <div className="absolute inset-0 z-0">
        <HomeMapGateway
          unlocked={mapUnlocked}
          onUnlock={handleMapUnlock}
          onLock={handleMapLock}
          deferMap={exploreParam !== MAP_EXPLORE_VALUE}
        />
      </div>

      <div className="pointer-events-none relative z-[60] flex min-h-[min(100dvh,920px)] flex-col">
        <div className="pointer-events-auto">
          <Navbar />
        </div>

        <div
          className={cn(
            "pointer-events-none mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 pt-8 transition-all duration-500 ease-out sm:px-6 sm:pb-20",
            mapUnlocked && "pointer-events-none opacity-0 -translate-y-5"
          )}
        >
          <div className="max-w-xl">
            <p className="label-data text-muted-foreground">Intelligence SaaS · France</p>
            <h1 className="mt-4 text-balance font-display text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Où naissent les SaaS{" "}
              <span className="text-muted-foreground">que vous pouvez importer.</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              La carte révèle les marchés chauds, les top revenus et le fit d&apos;import vers votre
              pays cible. Survolez, cliquez, décidez.
            </p>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-data text-xs uppercase tracking-data text-muted-foreground">
              <span>
                <strong className="text-foreground tabular-nums">{mapStats.countriesTracked}</strong>{" "}
                pays indexés
              </span>
              <span>
                <strong className="text-foreground tabular-nums">
                  {mapStats.totalMicroSaas.toLocaleString("fr-FR")}
                </strong>{" "}
                SaaS trackés
              </span>
              <span>
                Plus chaud :{" "}
                <strong className="text-primary">
                  {mapStats.hottestMarket.flag} {mapStats.hottestMarket.name}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeHeroFallback({ mapStats }: { mapStats: HomeMapStats }) {
  return (
    <section className="relative min-h-[min(100dvh,920px)] overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 z-0 radar-grid opacity-30" />
      <div className="relative z-[60] flex min-h-[min(100dvh,920px)] flex-col">
        <Navbar />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20">
          <p className="label-data text-muted-foreground">Intelligence SaaS · France</p>
          <p className="mt-4 font-data text-xs uppercase tracking-data text-muted-foreground">
            {mapStats.countriesTracked} pays indexés
          </p>
        </div>
      </div>
    </section>
  );
}

export function HomeHeroSection({ mapStats }: { mapStats: HomeMapStats }) {
  return (
    <Suspense fallback={<HomeHeroFallback mapStats={mapStats} />}>
      <HomeHeroInner mapStats={mapStats} />
    </Suspense>
  );
}

"use client";

import { TargetMarketProvider } from "@/context/target-market-context";
import {
  MapCatalogProvider,
  type MapCatalogOpportunity,
} from "@/context/map-catalog-context";
import { WorldMapHero } from "@/components/world/world-map-hero";
import { DeferredMapMount } from "@/components/world/deferred-map-mount";
import { MapHeroSkeleton } from "@/components/world/map-hero-skeleton";

export function HomeMapGateway({
  unlocked,
  onUnlock,
  onLock,
  deferMap = true,
  mapCatalog = [],
}: {
  unlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  deferMap?: boolean;
  mapCatalog?: MapCatalogOpportunity[];
}) {
  return (
    <MapCatalogProvider opportunities={mapCatalog}>
      <TargetMarketProvider>
        <DeferredMapMount
          immediate={!deferMap || unlocked}
          fallback={<MapHeroSkeleton className="absolute inset-0 z-0" />}
        >
          <WorldMapHero
            unlocked={unlocked}
            onUnlock={onUnlock}
            onLock={onLock}
            className="absolute inset-0 z-0"
          />
        </DeferredMapMount>
      </TargetMarketProvider>
    </MapCatalogProvider>
  );
}

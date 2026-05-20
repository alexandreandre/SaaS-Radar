"use client";

import { WorldMapHero } from "@/components/world/world-map-hero";
import { TargetMarketProvider } from "@/context/target-market-context";

export function HomeMapGateway({
  unlocked,
  onUnlock,
  onLock,
}: {
  unlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}) {
  return (
    <TargetMarketProvider>
      <WorldMapHero
        unlocked={unlocked}
        onUnlock={onUnlock}
        onLock={onLock}
        className="absolute inset-0 z-0"
      />
    </TargetMarketProvider>
  );
}

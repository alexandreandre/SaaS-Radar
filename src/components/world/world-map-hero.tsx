"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, AnimatePresence, m } from "framer-motion";
import { ComposableMap, Geographies } from "react-simple-maps";
import { getMarketByCode } from "@/data/world-markets";
import { resolveCountryCode } from "@/lib/country-code";
import { useMapPalette } from "@/hooks/use-map-palette";
import { useGeographyData } from "@/hooks/use-geography-data";
import { CountryHoverCard } from "@/components/world/country-hover-card";
import { CountryGeography } from "@/components/world/country-geography";
import type { MapHeroFilter } from "@/components/world/map-hero-dashboard";
import { useTargetMarket } from "@/context/target-market-context";
import { useMapCatalog } from "@/context/map-catalog-context";
import { getTargetFit } from "@/lib/target-market-fit";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MapHeroDashboard = dynamic(
  () =>
    import("@/components/world/map-hero-dashboard").then((m) => m.MapHeroDashboard),
  { ssr: false }
);

export function WorldMapHero({
  className,
  unlocked,
  showDashboard = false,
  onUnlock,
  onLock,
}: {
  className?: string;
  unlocked: boolean;
  showDashboard?: boolean;
  onUnlock: () => void;
  onLock: () => void;
}) {
  const router = useRouter();
  const { topology, status, retry } = useGeographyData();
  const { colors, getHeatColor, getHeatColorAmbient } = useMapPalette();
  const { target } = useTargetMarket();
  const { slugsForCountry } = useMapCatalog();
  const [hovered, setHovered] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<MapHeroFilter>("all");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countryClickRef = useRef(false);

  const hoveredMarket = hovered ? getMarketByCode(hovered) : null;
  const showHoverCard = !!hoveredMarket && !!hovered;

  useEffect(() => {
    setFilter("all");
  }, [target.code]);

  const isVisible = useCallback(
    (code: string) => {
      if (!unlocked) return true;
      const market = getMarketByCode(code);
      if (!market) return false;
      if (filter === "database") {
        if (target.code === "FR") return slugsForCountry(market.code).length > 0;
        return (
          market.code !== target.code &&
          getTargetFit(market.code, target.code).score >= 60
        );
      }
      if (filter === "hot") {
        return (
          market.code !== target.code &&
          getTargetFit(market.code, target.code).score >= 65
        );
      }
      return true;
    },
    [filter, target.code, unlocked, slugsForCountry]
  );

  const getFill = useCallback(
    (code: string) => {
      const market = getMarketByCode(code);
      if (!market || (unlocked && !isVisible(code))) return colors.dormant;
      if (hovered === code) return colors.hover;
      return unlocked ? getHeatColor(market.heatScore) : getHeatColorAmbient(market.heatScore);
    },
    [colors, getHeatColor, getHeatColorAmbient, hovered, unlocked, isVisible]
  );

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHovered(null), 150);
  }, []);

  const handleEnter = useCallback(
    (code: string | null, hasMarket: boolean) => {
      if (!code || !hasMarket) return;
      if (unlocked && !isVisible(code)) return;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setHovered(code);
    },
    [unlocked, isVisible]
  );

  const handleMapClick = useCallback(() => {
    if (!unlocked) onUnlock();
  }, [unlocked, onUnlock]);

  const goToCountryOpportunities = useCallback(
    (countryCode: string) => {
      setHovered(null);
      router.push(`/opportunities?country=${countryCode}`);
    },
    [router]
  );

  const handleGeographyClick = useCallback(
    (market: ReturnType<typeof getMarketByCode>, code: string | null) => {
      if (!unlocked) {
        onUnlock();
        return;
      }
      const countryCode = market?.code ?? code;
      if (countryCode) goToCountryOpportunities(countryCode);
    },
    [unlocked, onUnlock, goToCountryOpportunities]
  );

  const handleBack = useCallback(() => {
    setHovered(null);
    onLock();
  }, [onLock]);

  useEffect(() => {
    if (!showHoverCard) return;
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [showHoverCard]);

  const getCursor = (market: ReturnType<typeof getMarketByCode>, code: string | null) => {
    if (!unlocked) return "pointer";
    if (market && code && isVisible(code)) return "pointer";
    return "default";
  };

  const mapReady = status === "ready" && !!topology;

  return (
    <LazyMotion features={domAnimation}>
      <div
        className={cn(
          "absolute inset-0 overflow-hidden bg-background outline-none",
          !unlocked && "cursor-pointer",
          className
        )}
        onClick={
          !unlocked
            ? () => {
                if (countryClickRef.current) {
                  countryClickRef.current = false;
                  return;
                }
                handleMapClick();
              }
            : undefined
        }
        onKeyDown={
          !unlocked
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") handleMapClick();
              }
            : undefined
        }
        role={!unlocked ? "button" : undefined}
        tabIndex={!unlocked ? 0 : undefined}
        aria-label={!unlocked ? "Activer la carte interactive" : undefined}
      >
        {status === "error" && (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 bg-background/90">
            <p className="text-sm text-muted-foreground">Impossible de charger la carte</p>
            <Button size="sm" variant="outline" onClick={retry}>
              Réessayer
            </Button>
          </div>
        )}

        <div
          className={cn(
            "h-full w-full translate-x-[1%] transition-[filter,opacity] duration-500 sm:translate-x-[1.5%]",
            !unlocked && "saturate-[1.07] brightness-[1.04]",
            mapReady ? "opacity-100" : "opacity-0"
          )}
        >
          {mapReady && topology && (
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 155, center: [11, 19] }}
              className="h-full w-full [&_svg]:mx-auto [&_svg]:h-full [&_svg]:w-full"
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={topology}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const code = resolveCountryCode(geo);
                    const market = code ? getMarketByCode(code) : undefined;
                    const visible = code ? isVisible(code) : false;
                    const fill = code ? getFill(code) : colors.dormant;

                    return (
                      <CountryGeography
                        key={geo.rsmKey}
                        geo={geo}
                        fill={fill}
                        stroke={colors.stroke}
                        cursor={getCursor(market, code)}
                        pressedFill={unlocked && visible ? colors.selected : undefined}
                        onMouseEnter={() => handleEnter(code, !!market)}
                        onMouseLeave={() => scheduleHide()}
                        onClick={() => {
                          countryClickRef.current = true;
                          handleGeographyClick(market, code);
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          )}
        </div>

        <m.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/48 to-transparent sm:via-background/26"
          initial={false}
          animate={{ opacity: unlocked ? 0 : 1 }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <m.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/44 via-transparent to-background/12"
          initial={false}
          animate={{ opacity: unlocked ? 0 : 1 }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        />

        <AnimatePresence>
          {unlocked && showDashboard && (
            <MapHeroDashboard
              key="map-dashboard"
              onBack={handleBack}
              filter={filter}
              onFilterChange={setFilter}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showHoverCard && hoveredMarket && (
            <CountryHoverCard
              market={hoveredMarket}
              x={mouse.x}
              y={mouse.y}
            />
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}

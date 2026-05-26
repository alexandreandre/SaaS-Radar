"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMounted } from "@/hooks/use-mounted";
import { AnimatePresence, motion } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { getMarketByCode, getHeatColor, getHeatColorAmbient } from "@/data/world-markets";
import { MAP_COLORS } from "@/lib/map-colors";
import { resolveCountryCode } from "@/lib/country-code";
import { CountryHoverCard } from "@/components/world/country-hover-card";
import { MapHeroDashboard, type MapHeroFilter } from "@/components/world/map-hero-dashboard";
import { useTargetMarket } from "@/context/target-market-context";
import { getTargetFit } from "@/lib/target-market-fit";
import { cn } from "@/lib/utils";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMapHero({
  className,
  unlocked,
  onUnlock,
  onLock,
}: {
  className?: string;
  unlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const { target } = useTargetMarket();
  const [hovered, setHovered] = useState<string | null>(null);
  const [cardHovered, setCardHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<MapHeroFilter>("all");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countryClickRef = useRef(false);

  const hoveredMarket = hovered ? getMarketByCode(hovered) : null;
  const showHoverCard = unlocked && !!hoveredMarket && (hovered || cardHovered);

  useEffect(() => {
    setFilter("all");
  }, [target.code]);

  useEffect(() => {
    if (!unlocked) {
      setHovered(null);
      setCardHovered(false);
    }
  }, [unlocked]);

  const isVisible = useCallback(
    (code: string) => {
      if (!unlocked) return true;
      const market = getMarketByCode(code);
      if (!market) return false;
      if (filter === "database") {
        if (target.code === "FR") return market.opportunitySlugs.length > 0;
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
    [filter, target.code, unlocked]
  );

  const getFill = useCallback(
    (code: string) => {
      const market = getMarketByCode(code);
      if (!market || (unlocked && !isVisible(code))) return MAP_COLORS.dormant;
      if (unlocked && hovered === code) return MAP_COLORS.hover;
      return unlocked ? getHeatColor(market.heatScore) : getHeatColorAmbient(market.heatScore);
    },
    [hovered, unlocked, isVisible]
  );

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!cardHovered) setHovered(null);
    }, 150);
  }, [cardHovered]);

  const handleEnter = useCallback(
    (code: string | null, hasMarket: boolean) => {
      if (!unlocked || !code || !hasMarket || !isVisible(code)) return;
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
      setCardHovered(false);
      router.push(`/opportunities?country=${countryCode}`);
    },
    [router]
  );

  const handleGeographyClick = useCallback(
    (market: ReturnType<typeof getMarketByCode>, code: string | null) => {
      const countryCode = market?.code ?? code;
      if (!unlocked) onUnlock();
      if (countryCode) goToCountryOpportunities(countryCode);
    },
    [unlocked, onUnlock, goToCountryOpportunities]
  );

  const handleBack = useCallback(() => {
    setHovered(null);
    setCardHovered(false);
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

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-hero outline-none",
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
      <div
        className={cn(
          "h-full w-full transition-[filter] duration-500",
          !unlocked && "saturate-[1.07] brightness-[1.04]"
        )}
      >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 155, center: [12, 18] }}
        className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const code = resolveCountryCode(geo);
              const market = code ? getMarketByCode(code) : undefined;
              const visible = code ? isVisible(code) : false;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => handleEnter(code, !!market)}
                  onMouseLeave={() => unlocked && scheduleHide()}
                  onClick={() => {
                    countryClickRef.current = true;
                    handleGeographyClick(market, code);
                  }}
                  style={{
                    default: {
                      fill: code ? getFill(code) : MAP_COLORS.dormant,
                      stroke: MAP_COLORS.stroke,
                      strokeWidth: 0.25,
                      outline: "none",
                      cursor: getCursor(market, code),
                      transition: "fill 0.25s ease",
                    },
                    hover: { outline: "none" },
                    pressed: { fill: unlocked && visible ? MAP_COLORS.selected : undefined, outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-hero via-hero/54 to-transparent sm:via-hero/28"
        initial={false}
        animate={{ opacity: unlocked ? 0 : 1 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-hero/44 via-transparent to-hero/12"
        initial={false}
        animate={{ opacity: unlocked ? 0 : 1 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      />

      <AnimatePresence>
        {unlocked && (
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
            onEnter={() => {
              if (hideTimer.current) clearTimeout(hideTimer.current);
              setCardHovered(true);
            }}
            onLeave={() => {
              setCardHovered(false);
              scheduleHide();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!unlocked && (
          <motion.p
            initial={mounted ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute bottom-10 left-1/2 z-[2] -translate-x-1/2 font-data text-[10px] uppercase tracking-data text-map-muted"
          >
            Cliquez sur la carte pour explorer
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

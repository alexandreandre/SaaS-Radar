"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { getMarketByCode, getHeatColor } from "@/data/world-markets";
import { resolveCountryCode } from "@/lib/country-code";
import { cn } from "@/lib/utils";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMapHero({
  className,
  onActivate,
}: {
  className?: string;
  onActivate: (countryCode?: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const hoveredMarket = hovered ? getMarketByCode(hovered) : null;

  const getFill = useCallback(
    (code: string) => {
      const market = getMarketByCode(code);
      if (!market) return "#1C1C1F";
      if (hovered === code) return "#60A5FA";
      return getHeatColor(market.heatScore);
    },
    [hovered]
  );

  const handleActivate = useCallback(
    (code?: string) => {
      onActivate(code);
    },
    [onActivate]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleActivate();
      }}
      onClick={() => handleActivate()}
      className={cn(
        "absolute inset-0 cursor-pointer overflow-hidden bg-[#0A0A0A] outline-none",
        className
      )}
      aria-label="Ouvrir la carte interactive"
    >
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-900 via-[#0A0A0A] to-zinc-900" />
      )}

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

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => {
                    if (code && market) setHovered(code);
                  }}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    if (code) handleActivate(code);
                  }}
                  style={{
                    default: {
                      fill: code ? getFill(code) : "#1C1C1F",
                      stroke: "#27272A",
                      strokeWidth: 0.25,
                      outline: "none",
                      cursor: market ? "pointer" : "default",
                      transition: "fill 0.2s ease",
                    },
                    hover: { outline: "none" },
                    pressed: { fill: "#1D4ED8", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent sm:via-[#0A0A0A]/40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 via-transparent to-[#0A0A0A]/20" />

      {hoveredMarket && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute bottom-28 left-1/2 z-[2] -translate-x-1/2 rounded-xl border border-white/15 bg-black/80 px-4 py-2.5 text-center shadow-xl backdrop-blur-md"
        >
          <p className="text-sm font-medium text-white">
            {hoveredMarket.flag} {hoveredMarket.name}
          </p>
          <p className="text-xs text-zinc-400">Cliquez pour explorer</p>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="pointer-events-none absolute bottom-10 left-1/2 z-[2] -translate-x-1/2 text-sm text-zinc-500"
      >
        Cliquez sur la carte pour explorer
      </motion.p>
    </div>
  );
}

"use client";

import { useMemo, useState, useCallback, useEffect, useRef, startTransition } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  worldMarkets,
  getMarketByCode,
  getHeatColor,
  getGlobalStats,
} from "@/data/world-markets";
import { CountryPanel } from "@/components/world/country-panel";
import { CountryHoverCard } from "@/components/world/country-hover-card";
import { TargetMarketPicker } from "@/components/world/target-market-picker";
import { useTargetMarket } from "@/context/target-market-context";
import type { WorldMarket } from "@/types/world-market";
import { resolveCountryCode } from "@/lib/country-code";
import { getTargetFit } from "@/lib/target-market-fit";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, RotateCcw, Radar, ArrowLeft, X } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMapExplorer({
  embedded = false,
  initialCountry = null,
  onClose,
}: {
  embedded?: boolean;
  initialCountry?: string | null;
  onClose?: () => void;
} = {}) {
  const searchParams = useSearchParams();
  const { target } = useTargetMarket();
  const stats = useMemo(() => getGlobalStats(), []);
  const highFitCount = useMemo(
    () =>
      worldMarkets.filter(
        (m) => m.code !== target.code && getTargetFit(m.code, target.code).score >= 65
      ).length,
    [target.code]
  );
  const [selected, setSelected] = useState<WorldMarket | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [cardHovered, setCardHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ coordinates: [0, 28] as [number, number], zoom: 1.35 });
  const [filter, setFilter] = useState<"all" | "database" | "hot">("all");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFilter("all");
  }, [target.code]);

  useEffect(() => {
    const code = (embedded ? initialCountry : searchParams.get("country"))?.toUpperCase();
    if (!code) return;
    const market = getMarketByCode(code);
    if (market) startTransition(() => setSelected(market));
  }, [searchParams, embedded, initialCountry]);

  const hoveredMarket = hovered ? getMarketByCode(hovered) : null;
  const showHoverCard = !!hoveredMarket && (hovered || cardHovered) && !selected;

  const topEarnersGlobal = useMemo(
    () =>
      worldMarkets
        .flatMap((m) => m.topEarners.map((e) => ({ ...e, flag: m.flag, country: m.name, code: m.code })))
        .sort((a, b) => b.mrrUsd - a.mrrUsd)
        .slice(0, 8),
    []
  );

  useEffect(() => {
    if (!showHoverCard) return;
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [showHoverCard]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!cardHovered) setHovered(null);
    }, 150);
  }, [cardHovered]);

  const isVisible = useCallback(
    (code: string) => {
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
    [filter, target.code]
  );

  const filterOptions = useMemo(
    () =>
      [
        { id: "all" as const, label: "Tous les marchés" },
        {
          id: "hot" as const,
          label: `🔥 Top import → ${target.name} (65+)`,
        },
        {
          id: "database" as const,
          label:
            target.code === "FR"
              ? "Dans notre base"
              : `Candidats → ${target.name}`,
        },
      ],
    [target.code, target.name]
  );

  const getFill = useCallback(
    (code: string) => {
      const market = getMarketByCode(code);
      if (!market || !isVisible(code)) return "#1C1C1F";
      const isHovered = hovered === code || selected?.code === code;
      const isSelected = selected?.code === code;
      const base = getHeatColor(market.heatScore);
      if (isSelected) return "#1D4ED8";
      if (isHovered) return "#60A5FA";
      return base;
    },
    [hovered, selected, isVisible]
  );

  const handleEnter = useCallback((geo: { id?: string | number; properties?: { name?: string } }) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const code = resolveCountryCode(geo);
    if (code && getMarketByCode(code)) setHovered(code);
  }, []);

  const handleLeave = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  const openMarket = useCallback((market: WorldMarket) => {
    setHovered(null);
    setCardHovered(false);
    startTransition(() => setSelected(market));
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0A0A0A] text-white">
      <div className="relative min-h-0 flex-1">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent px-4 pb-20 pt-4 sm:px-6">
          <div className="pointer-events-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-zinc-400 backdrop-blur-md transition-colors hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                  Fermer
                </button>
              ) : !embedded ? (
                <Link
                  href="/"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-zinc-400 backdrop-blur-md transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Retour
                </Link>
              ) : null}
              <div className="flex items-center gap-2">
                <Radar className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">SaaS Radar</span>
              </div>
            </div>
            <div className="hidden items-center gap-5 text-xs text-zinc-400 sm:flex">
              <span>
                <strong className="text-white">{stats.countriesTracked}</strong> pays
              </span>
              <span>
                <strong className="text-white">{stats.totalMicroSaas.toLocaleString("fr-FR")}</strong> trackés
              </span>
              <span>
                <strong className="text-accent">{highFitCount}</strong> top import → {target.name}
              </span>
            </div>
          </div>

          <div className="pointer-events-auto mt-4 max-w-xl">
            <TargetMarketPicker />
          </div>

          {!embedded && (
            <div className="pointer-events-none mt-4 max-w-lg">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
                Intelligence globale
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Où naissent les micro-SaaS qui cartonnent
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Survolez un pays d&apos;origine — verdicts et scores d&apos;import vers{" "}
                <span className="text-white">
                  {target.flag} {target.name}
                </span>
                .
              </p>
            </div>
          )}

          <div className="pointer-events-auto mt-4 flex flex-wrap gap-2">
            {filterOptions.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors",
                  filter === f.id
                    ? "border-accent bg-accent text-white"
                    : "border-white/10 bg-black/50 text-zinc-400 hover:border-white/20 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="pointer-events-auto absolute right-4 z-20 flex flex-col gap-1 top-20 sm:bottom-44 sm:top-auto">
          {[
            { id: "zoom-in", Icon: ZoomIn, fn: () => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.35, 8) })) },
            { id: "zoom-out", Icon: ZoomOut, fn: () => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.35, 0.9) })) },
            { id: "reset", Icon: RotateCcw, fn: () => setPosition({ coordinates: [0, 28], zoom: 1.35 }) },
          ].map(({ id, Icon, fn }) => (
            <button
              key={id}
              type="button"
              onClick={fn}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-zinc-300 backdrop-blur-md hover:border-white/25 hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-44 left-4 z-20 hidden sm:block">
          <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Heat score</p>
            <div className="mt-2 flex gap-0.5">
              {["#27272A", "#1E3A5F", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"].map((c) => (
                <div key={c} className="h-2 w-8 first:rounded-l last:rounded-r" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
              <span>Veille</span>
              <span>Brûlant</span>
            </div>
          </div>
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 165, center: [0, 28] }}
          className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
          style={{ width: "100%", height: "100%", background: "#0A0A0A" }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={({ coordinates, zoom }) =>
              setPosition({ coordinates: coordinates as [number, number], zoom })
            }
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
                      onMouseEnter={() => handleEnter(geo)}
                      onMouseLeave={handleLeave}
                      onClick={() => market && openMarket(market)}
                      style={{
                        default: {
                          fill: code ? getFill(code) : "#1C1C1F",
                          stroke: "#3F3F46",
                          strokeWidth: 0.35,
                          outline: "none",
                          cursor: market && visible ? "pointer" : "default",
                        },
                        hover: { outline: "none" },
                        pressed: { fill: "#1D4ED8", outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        <AnimatePresence>
          {showHoverCard && hoveredMarket && (
            <CountryHoverCard
              market={hoveredMarket}
              x={mouse.x}
              y={mouse.y}
              onExplore={() => openMarket(hoveredMarket)}
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

        <CountryPanel market={selected} onClose={() => setSelected(null)} />
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-[#0A0A0A] px-4 py-4 sm:px-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Top revenus mondiaux · cette semaine
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-600">
              {stats.countriesTracked} pays indexés — cliquez pour ouvrir le marché
            </p>
          </div>
          <button
            type="button"
            onClick={() => openMarket(stats.hottestMarket)}
            className="text-xs text-zinc-500 hover:text-accent"
          >
            Plus chaud :{" "}
            <span className="font-medium text-white">
              {stats.hottestMarket.flag} {stats.hottestMarket.name}
            </span>
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-0.5">
          {topEarnersGlobal.map((e, i) => (
            <button
              key={`${e.name}-${i}`}
              type="button"
              onClick={() => {
                const m = getMarketByCode(e.code);
                if (m) openMarket(m);
              }}
              className="group flex min-w-[210px] shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-colors hover:border-accent/40 hover:bg-white/[0.08]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium group-hover:text-accent">{e.name}</p>
                <p className="truncate text-[11px] text-zinc-500">
                  {e.flag} {e.country}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-accent">{e.mrrLabel}</p>
                {e.code !== target.code &&
                  getTargetFit(e.code, target.code).score >= 65 && (
                    <p className="text-[10px] text-emerald-400">
                      {target.flag} {getTargetFit(e.code, target.code).score}
                    </p>
                  )}
              </div>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

"use client";

import { Suspense, useMemo, useState, useCallback, useEffect, useRef, startTransition } from "react";
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
  getHeatColorAmbient,
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
import { MAP_COLORS, HEAT_LEGEND } from "@/lib/map-colors";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Radar,
  ArrowLeft,
  X,
  Target,
  Flame,
  Database,
} from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const HERO_PROJECTION = { scale: 155, center: [12, 18] as [number, number] };
const HERO_POSITION = { coordinates: [12, 18] as [number, number], zoom: 1 };
const WORLD_PROJECTION = { scale: 165, center: [0, 28] as [number, number] };
const WORLD_POSITION = { coordinates: [0, 28] as [number, number], zoom: 1.35 };

type WorldMapExplorerProps = {
  embedded?: boolean;
  landingDormant?: boolean;
  onLandingActivate?: (countryCode?: string) => void;
  initialCountry?: string | null;
  onClose?: () => void;
};

function WorldMapExplorerFallback({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-hero text-map-muted",
        embedded ? "h-full" : "h-screen"
      )}
    >
      Chargement de la carte…
    </div>
  );
}

function WorldMapExplorerUrlBridge(props: WorldMapExplorerProps) {
  const searchParams = useSearchParams();
  return <WorldMapExplorerCore {...props} urlCountry={searchParams.get("country")} />;
}

export function WorldMapExplorer(props: WorldMapExplorerProps = {}) {
  if (props.embedded) {
    return <WorldMapExplorerCore {...props} urlCountry={null} />;
  }
  return (
    <Suspense fallback={<WorldMapExplorerFallback />}>
      <WorldMapExplorerUrlBridge {...props} />
    </Suspense>
  );
}

function WorldMapExplorerCore({
  embedded = false,
  landingDormant = false,
  onLandingActivate,
  initialCountry = null,
  onClose,
  urlCountry,
}: WorldMapExplorerProps & { urlCountry: string | null }) {
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
  const [position, setPosition] = useState(embedded ? HERO_POSITION : WORLD_POSITION);
  const [filter, setFilter] = useState<"all" | "database" | "hot">("all");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countryClickRef = useRef(false);

  useEffect(() => {
    setFilter("all");
  }, [target.code]);

  useEffect(() => {
    const code = (embedded ? initialCountry : urlCountry)?.toUpperCase();
    if (!code) return;
    const market = getMarketByCode(code);
    if (market) startTransition(() => setSelected(market));
  }, [urlCountry, embedded, initialCountry]);

  const hoveredMarket = hovered ? getMarketByCode(hovered) : null;
  const showHoverCard =
    !landingDormant && !!hoveredMarket && (hovered || cardHovered) && !selected;

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
        { id: "all" as const, label: "Tous", icon: Target, title: "Tous les marchés" },
        {
          id: "hot" as const,
          label: "Top import",
          icon: Flame,
          title: `Top import vers ${target.name} (score 65+)`,
        },
        {
          id: "database" as const,
          label: target.code === "FR" ? "En base" : "Candidats",
          icon: Database,
          title:
            target.code === "FR"
              ? "Dans notre base"
              : `Candidats import → ${target.name}`,
        },
      ],
    [target.code, target.name]
  );

  const getFill = useCallback(
    (code: string) => {
      const market = getMarketByCode(code);
      if (!market || !isVisible(code)) return MAP_COLORS.dormant;
      const isHovered = hovered === code || selected?.code === code;
      const isSelected = selected?.code === code;
      const heat = landingDormant ? getHeatColorAmbient : getHeatColor;
      const base = heat(market.heatScore);
      if (isSelected) return MAP_COLORS.selected;
      if (isHovered) return MAP_COLORS.hover;
      return base;
    },
    [hovered, selected, isVisible, landingDormant]
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

  const handleGeographyClick = useCallback(
    (market: WorldMarket | undefined, code: string | null) => {
      if (landingDormant) {
        onLandingActivate?.(code ?? undefined);
        return;
      }
      if (market) openMarket(market);
    },
    [landingDormant, onLandingActivate, openMarket]
  );

  const resetPosition = embedded ? HERO_POSITION : WORLD_POSITION;
  const uiZ = embedded ? "z-[55]" : "z-20";
  const embeddedToolbarTop = "top-16";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-hero text-white",
        embedded ? "h-full" : "h-screen"
      )}
    >
      <div
        className={cn("relative min-h-0 flex-1", landingDormant && "cursor-pointer")}
        onClick={() => {
          if (!landingDormant) return;
          if (countryClickRef.current) {
            countryClickRef.current = false;
            return;
          }
          onLandingActivate?.();
        }}
        onKeyDown={(e) => {
          if (landingDormant && (e.key === "Enter" || e.key === " ")) onLandingActivate?.();
        }}
        role={landingDormant ? "button" : undefined}
        tabIndex={landingDormant ? 0 : undefined}
        aria-label={landingDormant ? "Ouvrir la carte interactive" : undefined}
      >
        {landingDormant && (
          <>
            <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-hero via-hero/54 to-transparent sm:via-hero/28" />
            <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-hero/44 via-transparent to-hero/12" />
          </>
        )}

        {!landingDormant && (
          <header
            className={cn(
              "pointer-events-none px-4 sm:px-6",
              embedded
                ? cn("fixed inset-x-0 pb-3 pt-2", embeddedToolbarTop, uiZ)
                : "absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-hero via-hero/85 to-transparent pb-20 pt-4"
            )}
          >
            {!embedded && (
              <div className="pointer-events-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-map-muted backdrop-blur-md transition-colors hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour
                  </Link>
                  <div className="flex items-center gap-2">
                    <Radar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">SaaS Radar</span>
                  </div>
                </div>
                <div className="hidden items-center gap-5 text-xs text-map-muted sm:flex">
                  <span>
                    <strong className="text-white">{stats.countriesTracked}</strong> pays
                  </span>
                  <span>
                    <strong className="text-white">{stats.totalMicroSaas.toLocaleString("fr-FR")}</strong>{" "}
                    trackés
                  </span>
                  <span>
                    <strong className="text-primary">{highFitCount}</strong> top import → {target.name}
                  </span>
                </div>
              </div>
            )}

            {embedded ? (
              <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[11px] text-map-muted backdrop-blur-md transition-colors hover:text-hero-foreground/75"
                      aria-label="Revenir à l'accueil carte"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {filterOptions.map((f) => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        title={f.title}
                        onClick={() => setFilter(f.id)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-hero",
                          filter === f.id
                            ? "border-primary/70 bg-primary text-white"
                            : "border-white/10 bg-black/50 text-map-muted hover:border-white/20 hover:text-hero-foreground/75"
                        )}
                      >
                        <Icon className="h-2.5 w-2.5 shrink-0" />
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <TargetMarketPicker variant="discrete" />
              </div>
            ) : (
              <>
                <div className="pointer-events-auto mt-4 max-w-xl">
                  <TargetMarketPicker />
                </div>
                <div className="pointer-events-none mt-4 max-w-lg">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
                    Intelligence globale
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Où naissent les micro-SaaS qui cartonnent
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-map-muted">
                    Survolez un pays d&apos;origine — verdicts et scores d&apos;import vers{" "}
                    <span className="text-white">
                      {target.flag} {target.name}
                    </span>
                    .
                  </p>
                </div>
                <div className="pointer-events-auto mt-4 flex flex-wrap gap-2">
                  {filterOptions.map((f) => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        title={f.title}
                        onClick={() => setFilter(f.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-hero",
                          filter === f.id
                            ? "border-primary/70 bg-primary text-white"
                            : "border-white/10 bg-black/50 text-map-muted hover:border-white/20 hover:text-hero-foreground/90"
                        )}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span>{f.label}</span>
                        {f.id === "hot" && (
                          <span className="hidden text-hero-foreground/75/90 sm:inline">
                            → {target.flag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </header>
        )}

        {!landingDormant && (
        <div
          className={cn(
            "pointer-events-auto flex flex-col gap-1",
            embedded
              ? cn("fixed right-4 bottom-36", uiZ)
              : "absolute right-4 top-20 sm:bottom-44 sm:top-auto z-20"
          )}
        >
          {[
            { id: "zoom-in", Icon: ZoomIn, fn: () => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.35, 8) })) },
            { id: "zoom-out", Icon: ZoomOut, fn: () => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.35, 0.9) })) },
            { id: "reset", Icon: RotateCcw, fn: () => setPosition(resetPosition) },
          ].map(({ id, Icon, fn }) => (
            <button
              key={id}
              type="button"
              onClick={fn}
              aria-label={
                id === "zoom-in" ? "Zoom avant" : id === "zoom-out" ? "Zoom arrière" : "Réinitialiser la vue"
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-map-muted backdrop-blur-md transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-hero"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        )}

        {!landingDormant && (
        <div className={cn("pointer-events-none absolute bottom-44 left-4 hidden sm:block", uiZ)}>
          <div className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 backdrop-blur-md">
            <p className="text-[10px] font-medium uppercase tracking-wider text-map-muted">Heat score</p>
            <div className="mt-1.5 flex overflow-hidden rounded-md">
              {HEAT_LEGEND.map((c) => (
                <div key={c} className="h-1.5 w-7" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] tabular-nums text-map-muted">
              <span>Veille</span>
              <span>Brûlant</span>
            </div>
          </div>
        </div>
        )}

        <ComposableMap
          projection="geoMercator"
          projectionConfig={embedded ? HERO_PROJECTION : WORLD_PROJECTION}
          className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
          style={{ width: "100%", height: "100%", background: MAP_COLORS.ocean }}
        >
          <ZoomableGroup
            zoom={landingDormant ? 1 : position.zoom}
            center={landingDormant ? HERO_POSITION.coordinates : position.coordinates}
            onMoveEnd={
              landingDormant
                ? undefined
                : ({ coordinates, zoom }) =>
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
                      onClick={() => {
                        if (landingDormant && code) countryClickRef.current = true;
                        handleGeographyClick(market, code);
                      }}
                      style={{
                        default: {
                          fill: code ? getFill(code) : MAP_COLORS.dormant,
                          stroke: MAP_COLORS.stroke,
                          strokeWidth: 0.35,
                          outline: "none",
                          cursor: market && visible ? "pointer" : "default",
                        },
                        hover: { outline: "none" },
                        pressed: { fill: MAP_COLORS.selected, outline: "none" },
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

        {!landingDormant && (
          <CountryPanel
            market={selected}
            onClose={() => setSelected(null)}
            reserveNavbar={embedded}
          />
        )}
      </div>

      {!landingDormant && (
      <footer
        className={cn(
          "shrink-0 border-t border-white/10 bg-hero px-4 sm:px-6",
          embedded ? "border-white/5 py-2.5" : "py-3.5"
        )}
      >
        <div
          className={cn(
            "mb-3 flex flex-wrap items-end justify-between gap-2",
            embedded && "mb-2"
          )}
        >
          <div>
            <p
              className={cn(
                "font-medium uppercase tracking-wider text-map-muted",
                embedded ? "text-[10px]" : "text-xs"
              )}
            >
              Top revenus mondiaux · cette semaine
            </p>
            {!embedded && (
              <p className="mt-0.5 text-[11px] text-map-muted">
                {stats.countriesTracked} pays indexés — cliquez pour ouvrir le marché
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => openMarket(stats.hottestMarket)}
            className="text-xs text-map-muted transition-colors hover:text-hero-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-hero rounded-sm"
          >
            Plus chaud ·{" "}
            <span className="font-medium text-white">
              {stats.hottestMarket.flag} {stats.hottestMarket.name}
            </span>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {topEarnersGlobal.map((e, i) => {
            const fitScore =
              e.code !== target.code ? getTargetFit(e.code, target.code).score : null;
            const hotFit = fitScore !== null && fitScore >= 65;

            return (
              <button
                key={`${e.name}-${i}`}
                type="button"
                onClick={() => {
                  const m = getMarketByCode(e.code);
                  if (m) openMarket(m);
                }}
                className="group flex min-w-[188px] shrink-0 items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-hero"
              >
                <span className="w-4 shrink-0 text-[10px] tabular-nums text-map-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-hero-foreground/90 group-hover:text-white">
                    {e.name}
                  </p>
                  <p className="truncate text-[11px] text-map-muted">
                    {e.flag} {e.country}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-white">{e.mrrLabel}</p>
                  {hotFit && fitScore !== null && (
                    <p className="text-[10px] tabular-nums text-emerald-400/90">
                      {target.flag} {fitScore}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </footer>
      )}
    </div>
  );
}

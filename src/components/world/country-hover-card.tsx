"use client";

import { motion } from "framer-motion";
import type { WorldMarket } from "@/types/world-market";
import { getScopeLabel } from "@/data/world-markets";
import { getTargetFit, getTargetFitLabel } from "@/lib/target-market-fit";
import { useTargetMarket } from "@/context/target-market-context";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountryHoverCardProps {
  market: WorldMarket;
  x: number;
  y: number;
  onExplore: () => void;
  onEnter: () => void;
  onLeave: () => void;
}

export function CountryHoverCard({
  market,
  x,
  y,
  onExplore,
  onEnter,
  onLeave,
}: CountryHoverCardProps) {
  const { target } = useTargetMarket();
  const topEarner = market.topEarners[0];
  const topTrend = market.trends[0];
  const fit = getTargetFit(market.code, target.code);
  const cardWidth = 300;
  const cardHeight = 240;
  const padding = 16;

  const left = Math.min(Math.max(x + 16, padding), window.innerWidth - cardWidth - padding);
  const top = Math.min(Math.max(y - cardHeight / 2, padding), window.innerHeight - cardHeight - padding);

  const adaptableToTarget = fit.adaptable && fit.label !== "home";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 6 }}
      transition={{ duration: 0.15 }}
      style={{ left, top, width: cardWidth }}
      className="fixed z-50"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        onClick={onExplore}
        className="group w-full rounded-lg border border-white/10 bg-hero/95 p-3.5 text-left shadow-lg shadow-black/40 backdrop-blur-md transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-2xl">{market.flag}</span>
            <h3 className="mt-1 text-base font-semibold text-white">{market.name}</h3>
            <p className="text-[10px] text-map-muted">Origine · export vers {target.flag} {target.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ScopeBadge scope={market.scope} targetName={target.name} />
            <span className="text-[10px] tabular-nums text-map-muted">Heat {market.heatScore}</span>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-map-muted">
            Fit import → {target.name}
          </p>
          <p className={cn("mt-0.5 text-sm font-semibold", fit.score >= 65 ? "text-success" : "text-map-muted")}>
            {getTargetFitLabel(fit)} · {fit.score}/100
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <MiniStat label="Micro-SaaS" value={formatCompact(market.trackedMicroSaas)} />
          <MiniStat label="Nouveaux" value={`+${market.newThisMonth}`} accent />
          <MiniStat label="En base" value={String(market.opportunitySlugs.length)} />
        </div>

        {topEarner && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-map-muted">Top revenu</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-white">{topEarner.name}</p>
              <p className="shrink-0 text-sm font-semibold text-primary">{topEarner.mrrLabel}</p>
            </div>
            {adaptableToTarget && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
                <Sparkles className="h-3 w-3" />
                Transférable vers {target.name}
              </p>
            )}
          </div>
        )}

        {topTrend && (
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-map-muted">
            <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            {topTrend}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm font-medium text-hero-foreground/80 transition-colors group-hover:text-white">
          <span>Voir l&apos;analyse</span>
          <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>
    </motion.div>
  );
}

function ScopeBadge({ scope, targetName }: { scope: WorldMarket["scope"]; targetName: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-hero-foreground/80">
      {getScopeLabel(scope, targetName)}
    </span>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
      <p className={cn("text-sm font-semibold tabular-nums", accent ? "text-primary" : "text-white")}>{value}</p>
      <p className="text-[9px] text-map-muted">{label}</p>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

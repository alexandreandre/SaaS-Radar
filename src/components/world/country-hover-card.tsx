"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { WorldMarket } from "@/types/world-market";
import type { MapCatalogOpportunity } from "@/context/map-catalog-context";
import { getTargetFit, getTargetFitLabel } from "@/lib/target-market-fit";
import { useTargetMarket } from "@/context/target-market-context";
import { useMapCatalog } from "@/context/map-catalog-context";
import { formatCurrency, cn } from "@/lib/utils";
import { Layers, MousePointerClick, Sparkles } from "lucide-react";

const PREVIEW_LIMIT = 3;
const CARD_WIDTH = 360;

interface CountryHoverCardProps {
  market: WorldMarket;
  x: number;
  y: number;
}

export function CountryHoverCard({
  market,
  x,
  y,
}: CountryHoverCardProps) {
  const { target } = useTargetMarket();
  const { opportunitiesForCountry } = useMapCatalog();
  const fit = getTargetFit(market.code, target.code);

  const opportunities = useMemo(
    () =>
      [...opportunitiesForCountry(market.code)].sort(
        (a, b) => b.scores.opportunity - a.scores.opportunity
      ),
    [opportunitiesForCountry, market.code]
  );

  const preview = opportunities.slice(0, PREVIEW_LIMIT);
  const remaining = opportunities.length - preview.length;
  const isHomeMarket = fit.label === "home";

  const cardHeight = opportunities.length > 0 ? 300 + preview.length * 12 : 200;
  const padding = 16;
  const left = Math.min(Math.max(x + 16, padding), window.innerWidth - CARD_WIDTH - padding);
  const top = Math.min(
    Math.max(y - cardHeight / 2, padding),
    window.innerHeight - cardHeight - padding
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 6 }}
      transition={{ duration: 0.15 }}
      style={{ left, top, width: CARD_WIDTH }}
      className="pointer-events-none fixed z-50"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-background/95 shadow-lg shadow-black/40 backdrop-blur-md">
        <div className="border-b border-border bg-muted/20 px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{market.flag}</span>
                <h3 className="truncate text-base font-semibold text-foreground">{market.name}</h3>
              </div>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                {isHomeMarket
                  ? `Idées SaaS à lancer sur ${target.name}`
                  : `Idées SaaS sourcées ici · à adapter pour ${target.flag} ${target.name}`}
              </p>
            </div>
            <OpportunityCountBadge count={opportunities.length} />
          </div>
        </div>

        <div className="px-4 py-3">
          {opportunities.length === 0 ? (
            <EmptyOpportunitiesState market={market} targetName={target.name} fitScore={fit.score} />
          ) : (
            <>
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Layers className="h-3 w-3 text-primary" />
                Nos opportunités
              </div>
              <ul className="space-y-1.5">
                {preview.map((opp, index) => (
                  <OpportunityPreviewRow
                    key={opp.slug}
                    opportunity={opp}
                    rank={index + 1}
                    highlight={index === 0}
                  />
                ))}
              </ul>
              {remaining > 0 && (
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  +{remaining} autre{remaining > 1 ? "s" : ""} idée{remaining > 1 ? "s" : ""}
                </p>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border bg-muted/10 px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {isHomeMarket ? "Marché local" : `Fit import → ${target.name}`}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs font-semibold",
                  fit.score >= 65 ? "text-success" : "text-muted-foreground"
                )}
              >
                {getTargetFitLabel(fit)} · {fit.score}/100
              </p>
            </div>
            <FitBar score={fit.score} />
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-center text-[11px] text-muted-foreground">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          {opportunities.length > 0
            ? `Cliquez sur ${market.name} pour voir les ${opportunities.length} opportunité${opportunities.length > 1 ? "s" : ""}`
            : `Cliquez sur ${market.name} pour explorer ce marché`}
        </p>
      </div>
    </motion.div>
  );
}

function OpportunityCountBadge({ count }: { count: number }) {
  return (
    <div className="shrink-0 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-center">
      <p className="text-lg font-bold tabular-nums leading-none text-primary">{count}</p>
      <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-primary/80">
        {count <= 1 ? "idée" : "idées"}
      </p>
    </div>
  );
}

function OpportunityPreviewRow({
  opportunity,
  rank,
  highlight,
}: {
  opportunity: MapCatalogOpportunity;
  rank: number;
  highlight?: boolean;
}) {
  return (
    <li>
      <div
        className={cn(
          "rounded-lg border px-3 py-2.5",
          highlight ? "border-primary/30 bg-primary/5" : "border-border bg-muted/15"
        )}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {rank}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug text-foreground">{opportunity.name}</p>
              <span className="shrink-0 rounded-md bg-background px-1.5 py-0.5 text-xs font-bold tabular-nums text-primary">
                {opportunity.scores.opportunity}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
              {opportunity.pitch}
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground/70">
              {formatCurrency(opportunity.revenueMin)}–{formatCurrency(opportunity.revenueMax)}
              <span className="font-normal text-muted-foreground">/mois</span>
            </p>
          </div>
        </div>
        {highlight && (
          <p className="mt-2 flex items-center gap-1 pl-7 text-[10px] text-emerald-400">
            <Sparkles className="h-3 w-3" />
            Meilleur score pour ce pays
          </p>
        )}
      </div>
    </li>
  );
}

function EmptyOpportunitiesState({
  market,
  targetName,
  fitScore,
}: {
  market: WorldMarket;
  targetName: string;
  fitScore: number;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center">
      <p className="text-sm font-medium text-foreground">Aucune idée indexée pour l&apos;instant</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Nous n&apos;avons pas encore de playbook SaaS sourcé depuis {market.name}
        {fitScore >= 55 ? `, mais le marché reste intéressant pour ${targetName}.` : "."}
      </p>
      <p className="mt-3 text-[11px] tabular-nums text-muted-foreground">
        {market.trackedMicroSaas.toLocaleString("fr-FR")} micro-SaaS suivis · Heat {market.heatScore}
      </p>
    </div>
  );
}

function FitBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted/50">
      <div
        className={cn(
          "h-full rounded-full",
          score >= 75 ? "bg-success" : score >= 50 ? "bg-primary/70" : "bg-muted-foreground/40"
        )}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

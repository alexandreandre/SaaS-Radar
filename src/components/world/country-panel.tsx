"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { WorldMarket } from "@/types/world-market";
import { getScopeLabel } from "@/data/world-markets";
import { useTargetMarket } from "@/context/target-market-context";
import { useMapCatalog } from "@/context/map-catalog-context";
import {
  getTargetFit,
  getTargetFitLabel,
  getTargetVerdict,
  type TargetFit,
  getRecommendedAction,
  isAdaptableToTarget,
} from "@/lib/target-market-fit";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3,
  Flame,
  CheckCircle2,
} from "lucide-react";

const trendMeta = {
  rising: { label: "En hausse", icon: TrendingUp, color: "text-emerald-400" },
  stable: { label: "Stable", icon: Minus, color: "text-muted-foreground" },
  emerging: { label: "Émergent", icon: TrendingUp, color: "text-primary" },
  cooling: { label: "En baisse", icon: TrendingDown, color: "text-amber-400" },
} as const;

const QUICK = { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const };

export function CountryPanel({
  market,
  onClose,
  reserveNavbar = false,
}: {
  market: WorldMarket | null;
  onClose: () => void;
  /** Laisse la barre de navigation du site visible (landing / carte embarquée). */
  reserveNavbar?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!market) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [market, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {market && (
        <div
          className={cn(
            "fixed z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6",
            reserveNavbar ? "inset-x-0 bottom-0 top-16 sm:top-16" : "inset-0",
          )}
        >
          <motion.button
            type="button"
            aria-label="Fermer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={QUICK}
            className="absolute inset-0 bg-background/80"
            onClick={onClose}
          />

          <motion.div
            key={market.code}
            role="dialog"
            aria-modal="true"
            aria-labelledby="country-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={QUICK}
            className="relative flex max-h-[min(92dvh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background text-foreground shadow-2xl sm:max-h-[min(88vh,820px)] sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CountryModalContent market={market} onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

const CountryModalContent = memo(function CountryModalContent({
  market,
  onClose,
}: {
  market: WorldMarket;
  onClose: () => void;
}) {
  const router = useRouter();
  const { target } = useTargetMarket();
  const { opportunitiesForCountry } = useMapCatalog();
  const fit = useMemo(() => getTargetFit(market.code, target.code), [market.code, target.code]);

  const dbOpps = useMemo(
    () =>
      [...opportunitiesForCountry(market.code)].sort(
        (a, b) => b.scores.opportunity - a.scores.opportunity
      ),
    [opportunitiesForCountry, market.code]
  );

  const adaptableCount = market.topEarners.filter(
    (e) => e.franceAdaptable && isAdaptableToTarget(market.code, target.code)
  ).length;
  const maxMrr = Math.max(...market.topEarners.map((e) => e.mrrUsd), 1);
  const TrendIcon = trendMeta[market.trend].icon;
  const verdict = getTargetVerdict(
    market.name,
    market.code,
    target.code,
    target.name,
    market.heatScore,
    adaptableCount,
    dbOpps.length
  );
  const ctaLabel = getRecommendedAction(target.code, target.name, market.code, dbOpps.length, fit);

  return (
    <>
      <div className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl leading-none sm:text-5xl">{market.flag}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 id="country-modal-title" className="text-xl font-semibold sm:text-2xl">
                  {market.name}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Origine · export vers {target.flag} {target.name}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ScopePill scope={market.scope} targetName={target.name} />
              <span className={cn("inline-flex items-center gap-1 text-xs", trendMeta[market.trend].color)}>
                <TrendIcon className="h-3.5 w-3.5" />
                {trendMeta[market.trend].label}
              </span>
              <span className="text-xs text-muted-foreground">Heat {market.heatScore}/100</span>
            </div>
            <HeatBar score={market.heatScore} />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid gap-px border-b border-border bg-muted/40 sm:grid-cols-2">
          <VerdictBlock
            verdict={verdict}
            fit={fit}
            targetName={target.name}
            targetFlag={target.flag}
          />
          <div className="grid grid-cols-2 gap-px bg-muted/40">
            <Kpi label="SaaS" value={market.trackedMicroSaas.toLocaleString("fr-FR")} />
            <Kpi label="Nouveaux/mois" value={`+${market.newThisMonth}`} highlight />
            <Kpi label="Top MRR moy." value={`$${(market.avgTopMrrUsd / 1000).toFixed(0)}k`} />
            <Kpi label={`Fit → ${target.name}`} value={`${fit.score}`} highlight={fit.score >= 65} />
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <section>
            <SectionTitle icon={BarChart3} title="Top revenus" />
            <ul className="mt-3 space-y-2">
              {market.topEarners.map((e, i) => (
                <li key={`${e.name}-${i}`} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{e.category}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-primary">{e.mrrLabel}</p>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(10, (e.mrrUsd / maxMrr) * 100)}%` }}
                    />
                  </div>
                  {e.franceAdaptable && isAdaptableToTarget(market.code, target.code) && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
                      <Sparkles className="h-3 w-3" /> Transférable → {target.name}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionTitle icon={Flame} title="Trends" />
            <ul className="mt-3 space-y-2">
              {market.trends.map((t, i) => (
                <li
                  key={t}
                  className="flex gap-2 rounded-lg border border-border/60 px-3 py-2.5 text-sm text-foreground/80"
                >
                  <span className="font-semibold text-primary">{i + 1}</span>
                  <span className="leading-snug">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <SectionTitle
                icon={CheckCircle2}
                title="Notre base"
                badge={dbOpps.length > 0 ? String(dbOpps.length) : undefined}
              />
              {dbOpps.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  Aucun playbook indexé depuis {market.name} pour l&apos;instant.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {dbOpps.map((o) => (
                    <li key={o.slug}>
                      <Link
                        href={`/opportunities/${o.slug}`}
                        className="block rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">{o.name}</p>
                          <span className="shrink-0 text-xs font-bold text-primary">
                            {o.scores.opportunity}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatCurrency(o.revenueMin)}–{formatCurrency(o.revenueMax)}/mois
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground sm:px-6">
          {market.insight}
        </p>
      </div>

      <div className="shrink-0 space-y-3 border-t border-border p-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.push(`/opportunities?country=${market.code}`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          Voir les opportunités pour ce pays →
        </button>
        {dbOpps.length > 0 && (
          <Link
            href={`/opportunities/${dbOpps[0].slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </>
  );
});

function VerdictBlock({
  verdict,
  fit,
  targetName,
  targetFlag,
}: {
  verdict: string;
  fit: TargetFit;
  targetName: string;
  targetFlag: string;
}) {
  return (
    <div className="bg-background p-5 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
        <Target className="h-3.5 w-3.5" />
        Verdict · {targetFlag} {targetName}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {getTargetFitLabel(fit)} · score {fit.score}/100
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">{verdict}</p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
      {badge && (
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
          {badge}
        </span>
      )}
    </div>
  );
}

function ScopePill({ scope, targetName }: { scope: WorldMarket["scope"]; targetName: string }) {
  const styles = {
    priority: "bg-primary/20 text-primary border-primary/30",
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    emerging: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    watch: "bg-map-muted/15 text-muted-foreground border-map-border/25",
  };
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[scope])}>
      {getScopeLabel(scope, targetName)}
    </span>
  );
}

function HeatBar({ score }: { score: number }) {
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/40">
      <div
        className={cn(
          "h-full rounded-full",
          score >= 75 ? "bg-primary" : score >= 50 ? "bg-primary/70" : "bg-map-border"
        )}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-background px-4 py-3">
      <p className={cn("text-base font-semibold tabular-nums", highlight && "text-primary")}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

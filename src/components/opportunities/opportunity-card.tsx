"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMounted } from "@/hooks/use-mounted";
import type { OpportunityListItem } from "@/types/opportunity";
import { FavoriteButton } from "@/components/opportunities/favorite-button";
import { ScoreGauge } from "@/components/scores/score-gauge";
import { ScoreStars } from "@/components/scores/score-stars";
import { formatCurrency, cn, excerptForCard } from "@/lib/utils";
import { sectorLabels } from "@/data/opportunities";
import { ArrowRight } from "lucide-react";

const subScores: { key: keyof OpportunityListItem["scores"]; label: string; max: number }[] = [
  { key: "franceFit", label: "FR Fit", max: 10 },
  { key: "buildability", label: "Build", max: 10 },
  { key: "margin", label: "Marge", max: 10 },
  { key: "competitionGap", label: "Comp.", max: 10 },
];

export function OpportunityCard({
  opportunity,
  index = 0,
  isTopPick = false,
}: {
  opportunity: OpportunityListItem;
  index?: number;
  isTopPick?: boolean;
}) {
  const mounted = useMounted();
  const sectorLabel = sectorLabels[opportunity.sector] ?? opportunity.sector;
  const showTopBadge = isTopPick || opportunity.weeklyPick;
  const cardTarget = excerptForCard(opportunity.targetClient, 84);
  const cardPitch = opportunity.pitch ? excerptForCard(opportunity.pitch, 100) : null;

  return (
    <motion.div
      initial={mounted ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(showTopBadge && "pt-2.5")}
    >
      <Link href={`/opportunities/${opportunity.slug}`} className="block h-full">
        <article
          className={cn(
            "group relative flex h-full flex-col rounded-lg border bg-card p-5 shadow-card transition-all",
            "hover:border-primary/40 hover:bg-accent/20 hover:shadow-card-hover",
            showTopBadge ? "border-primary/30 ring-1 ring-primary/20" : "border-border"
          )}
        >
          {showTopBadge && (
            <span className="absolute left-4 top-0 z-10 -translate-y-1/2 rounded-sm bg-primary px-2.5 py-0.5 font-data text-[10px] font-medium uppercase tracking-data text-primary-foreground shadow-sm">
              Top semaine
            </span>
          )}

          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                <span className="mr-1">{opportunity.originFlag}</span>
                {opportunity.originCountry}
                <span className="mx-1.5">·</span>
                {sectorLabel}
                {opportunity.publishedAt && (
                  <>
                    <span className="mx-1.5">·</span>
                    {new Date(opportunity.publishedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </>
                )}
              </p>
              <h3 className="mt-2 text-base font-semibold leading-snug group-hover:text-primary">
                {opportunity.name}
              </h3>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {cardTarget}
              </p>
            </div>

            <div className="shrink-0 pt-0.5">
              <ScoreGauge
                label=""
                value={opportunity.scores.opportunity}
                max={100}
                size="sm"
                delay={index * 0.05}
                hideLabel
                showMax
              />
            </div>
          </div>

          {cardPitch && (
            <p className="font-display mt-3 text-sm italic leading-snug text-foreground sm:text-base">
              « {cardPitch} »
            </p>
          )}

          <div className="mt-3 hidden flex-wrap gap-x-3 gap-y-1 font-data text-[10px] sm:flex">
            {subScores.map(({ key, label, max }) => (
              <ScoreStars key={key} label={label} value={opportunity.scores[key]} max={max} />
            ))}
          </div>
          <p className="mt-3 font-data text-[10px] leading-relaxed text-muted-foreground sm:hidden">
            FR {opportunity.scores.franceFit}/10 · Build {opportunity.scores.buildability}/10 · Marge{" "}
            {opportunity.scores.margin}/10
          </p>

          <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="label-data">Potentiel estimé</p>
              <p className="mt-1 font-display text-lg font-medium leading-none tabular-nums tracking-tight text-foreground">
                {formatCurrency(opportunity.revenueMin)}
                <span className="text-muted-foreground">–</span>
                {formatCurrency(opportunity.revenueMax)}
                <span className="ml-1.5 font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                  /mois
                </span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <FavoriteButton slug={opportunity.slug} size="sm" variant="pill" stopNavigation />
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
                Voir le plan
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Opportunity } from "@/types/opportunity";
import { ScoreGauge } from "@/components/scores/score-gauge";
import { ScoreStars } from "@/components/scores/score-stars";
import { formatCurrency, cn } from "@/lib/utils";
import { sectorLabels } from "@/data/opportunities";
import { ArrowRight } from "lucide-react";

const subScores: { key: keyof Opportunity["scores"]; label: string; max: number }[] = [
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
  opportunity: Opportunity;
  index?: number;
  isTopPick?: boolean;
}) {
  const sectorLabel = sectorLabels[opportunity.sector] ?? opportunity.sector;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/opportunities/${opportunity.slug}`} className="block h-full">
        <article
          className={cn(
            "group relative flex h-full flex-col rounded-lg border bg-card p-5 shadow-card transition-all",
            "hover:border-primary/40 hover:bg-accent/20 hover:shadow-card-hover",
            isTopPick ? "border-primary/30 ring-1 ring-primary/20" : "border-border"
          )}
        >
          {isTopPick && (
            <span className="absolute left-4 top-4 rounded-sm bg-primary px-2 py-0.5 font-data text-[10px] font-medium uppercase tracking-data text-primary-foreground">
              Top semaine
            </span>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className={cn("min-w-0 flex-1", isTopPick && "pt-7")}>
              <p className="font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                <span className="mr-1">{opportunity.originFlag}</span>
                {opportunity.originCountry}
                <span className="mx-1.5">·</span>
                {sectorLabel}
              </p>
              <h3 className="mt-2 text-base font-semibold leading-snug group-hover:text-primary">
                {opportunity.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{opportunity.targetClient}</p>
            </div>
            <div className="shrink-0 -mr-1 -mt-1">
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

          {opportunity.pitch && (
            <p className="font-display mt-3 line-clamp-2 text-base italic leading-relaxed text-foreground">
              « {opportunity.pitch} »
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-data text-[10px]">
            {subScores.map(({ key, label, max }) => (
              <ScoreStars
                key={key}
                label={label}
                value={opportunity.scores[key]}
                max={max}
              />
            ))}
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
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
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
              Voir le plan
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

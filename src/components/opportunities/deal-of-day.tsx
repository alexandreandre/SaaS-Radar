"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { CountdownTimer } from "@/components/opportunities/countdown-timer";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { sectorLabels } from "@/data/opportunities";

export function DealOfDayCard({ opportunity }: { opportunity: Opportunity }) {
  const sectorLabel = sectorLabels[opportunity.sector] ?? opportunity.sector;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link
        href={`/opportunities/${opportunity.slug}`}
        className="group block rounded-lg border border-primary/30 bg-accent/25 p-4 shadow-card ring-1 ring-primary/10 transition-colors hover:border-primary/40 hover:bg-accent/35 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge className="border-transparent bg-destructive text-destructive-foreground">Deal du jour</Badge>
          <CountdownTimer variant="day" />
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
              <span className="mr-1">{opportunity.originFlag}</span>
              {opportunity.originCountry}
              <span className="mx-1.5">·</span>
              {sectorLabel}
            </p>
            <h3 className="mt-1 font-display text-lg font-medium leading-snug group-hover:text-primary sm:text-xl">
              {opportunity.name}
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{opportunity.pitch}</p>
          </div>

          <div className="flex shrink-0 items-end gap-4 sm:gap-6">
            <div className="text-right">
              <p className="label-data">Potentiel estimé</p>
              <p className="mt-0.5 font-display text-xl font-medium leading-none tabular-nums tracking-tight text-foreground sm:text-2xl">
                {formatCurrency(opportunity.revenueMin)}
                <span className="text-muted-foreground">–</span>
                {formatCurrency(opportunity.revenueMax)}
                <span className="ml-1 font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                  /mois
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                Score
              </p>
              <p className="font-display text-lg font-medium tabular-nums text-primary">
                {Math.round(opportunity.scores.opportunity)}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

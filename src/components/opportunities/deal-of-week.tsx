"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMounted } from "@/hooks/use-mounted";
import type { Opportunity } from "@/types/opportunity";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/scores/score-gauge";
import { CountdownTimer } from "@/components/opportunities/countdown-timer";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { sectorLabels } from "@/data/opportunities";
import { SCORE_AXIS_LABELS, SUB_SCORE_KEYS } from "@/lib/scoring/rubric";

export function DealOfWeekCard({ opportunity, dark = false }: { opportunity: Opportunity; dark?: boolean }) {
  const mounted = useMounted();
  const sectorLabel = sectorLabels[opportunity.sector] ?? opportunity.sector;
  const scores = [
    { label: SCORE_AXIS_LABELS.opportunity, value: opportunity.scores.opportunity, max: 100 },
    ...SUB_SCORE_KEYS.map((key) => ({
      label: SCORE_AXIS_LABELS[key],
      value: opportunity.scores[key],
      max: 10 as const,
    })),
  ];

  return (
    <motion.div
      initial={mounted ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={
        dark
          ? "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          : "rounded-lg border border-primary/20 bg-accent/40 p-6 shadow-card"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge className={dark ? "bg-primary text-primary-foreground" : ""}>Deal de la semaine</Badge>
        <CountdownTimer dark={dark} />
      </div>
      <h3 className={`mt-4 text-xl font-semibold ${dark ? "text-white" : ""}`}>{opportunity.name}</h3>
      <p className={`mt-1 text-sm ${dark ? "text-map-muted" : "text-muted-foreground"}`}>
        {opportunity.originFlag} {opportunity.originCountry} · {sectorLabel}
      </p>
      <div className="mt-6 flex flex-wrap justify-between gap-4">
        {scores.map((s, i) => (
          <ScoreGauge key={s.label} {...s} size="sm" delay={i * 0.1} />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`label-data ${dark ? "text-map-muted" : ""}`}>Potentiel estimé</p>
          <p className={`text-lg font-semibold ${dark ? "text-white" : ""}`}>
            {formatCurrency(opportunity.revenueMin)}–{formatCurrency(opportunity.revenueMax)}/mois
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href={`/opportunities/${opportunity.slug}`}>Voir le plan complet</Link>
        </Button>
      </div>
    </motion.div>
  );
}

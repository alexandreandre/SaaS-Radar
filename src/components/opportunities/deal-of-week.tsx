"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Opportunity } from "@/types/opportunity";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/scores/score-gauge";
import { CountdownTimer } from "@/components/opportunities/countdown-timer";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function DealOfWeekCard({ opportunity, dark = false }: { opportunity: Opportunity; dark?: boolean }) {
  const scores = [
    { label: "Opportunité", value: opportunity.scores.opportunity, max: 100 },
    { label: "France Fit", value: opportunity.scores.franceFit, max: 10 },
    { label: "Buildability", value: opportunity.scores.buildability, max: 10 },
    { label: "Marge", value: opportunity.scores.margin, max: 10 },
    { label: "Competition", value: opportunity.scores.competitionGap, max: 10 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={
        dark
          ? "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          : "rounded-2xl border border-accent/20 bg-accent-muted/50 p-6"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge className={dark ? "bg-accent text-white" : ""}>Deal de la semaine</Badge>
        <CountdownTimer dark={dark} />
      </div>
      <h3 className={`mt-4 text-xl font-semibold ${dark ? "text-white" : ""}`}>{opportunity.name}</h3>
      <p className={`mt-1 text-sm ${dark ? "text-zinc-400" : "text-muted-foreground"}`}>
        {opportunity.originFlag} {opportunity.originCountry} → France · {opportunity.targetClient}
      </p>
      <div className="mt-6 flex flex-wrap justify-between gap-4">
        {scores.map((s, i) => (
          <ScoreGauge key={s.label} {...s} size="sm" delay={i * 0.1} />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`text-xs ${dark ? "text-zinc-500" : "text-muted-foreground"}`}>Potentiel estimé</p>
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

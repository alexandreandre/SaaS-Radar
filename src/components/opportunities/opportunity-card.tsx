"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Opportunity } from "@/types/opportunity";
import { Badge } from "@/components/ui/badge";
import { ScoreBars } from "@/components/scores/score-bars";
import { formatCurrency } from "@/lib/utils";
import { sectorLabels } from "@/data/opportunities";
import { ArrowUpRight } from "lucide-react";

export function OpportunityCard({ opportunity, index = 0 }: { opportunity: Opportunity; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/opportunities/${opportunity.slug}`}>
        <article className="group rounded-xl border border-border bg-white p-5 shadow-card transition-all hover:border-accent/30 hover:shadow-card-hover">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{opportunity.originFlag}</span>
                <span>{opportunity.originCountry}</span>
                <span>·</span>
                <span>{sectorLabels[opportunity.sector]}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold leading-snug group-hover:text-accent">
                {opportunity.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{opportunity.targetClient}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-accent" />
          </div>
          <div className="mt-4">
            <ScoreBars scores={opportunity.scores} compact />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {opportunity.boringBusiness && <Badge variant="success">Boring business ✓</Badge>}
              {opportunity.aiPowered && <Badge>AI-powered ✓</Badge>}
              {opportunity.buildableUnder30Days && <Badge variant="outline">Buildable &lt;30j ✓</Badge>}
              {opportunity.lowCompetition && <Badge variant="secondary">Low competition ✓</Badge>}
            </div>
            <p className="text-sm font-medium tabular-nums">
              {formatCurrency(opportunity.revenueMin)}–{formatCurrency(opportunity.revenueMax)}/mois
            </p>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

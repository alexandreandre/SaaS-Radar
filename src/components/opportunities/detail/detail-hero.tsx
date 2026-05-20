"use client";

import Link from "next/link";
import type { Opportunity } from "@/types/opportunity";
import { ScoreGauge } from "@/components/scores/score-gauge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { sectorLabels } from "@/data/opportunities";
import { ArrowRight } from "lucide-react";

export function DetailHero({ opportunity }: { opportunity: Opportunity }) {
  const sectorLabel = sectorLabels[opportunity.sector] ?? opportunity.sector;
  const subGauges = [
    { label: "Adapté France", value: opportunity.scores.franceFit, max: 10 },
    { label: "Facile à créer", value: opportunity.scores.buildability, max: 10 },
    { label: "Rentabilité", value: opportunity.scores.margin, max: 10 },
    { label: "Peu de concurrence", value: opportunity.scores.competitionGap, max: 10 },
  ];

  return (
    <header className="rounded-xl bg-hero px-6 pb-9 pt-4 text-hero-foreground sm:px-10 sm:pb-10 sm:pt-5">
      <p className="text-sm text-map-muted">
        <span className="mr-1">{opportunity.originFlag}</span>
        {opportunity.originCountry}
        <span className="mx-1.5">·</span>
        {sectorLabel}
      </p>
      <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-[2.75rem]">
        {opportunity.name}
      </h1>
      <p className="mt-4 max-w-2xl text-xl leading-relaxed text-hero-foreground/90">{opportunity.pitch}</p>
      <p className="mt-2 text-base text-map-muted">Pour : {opportunity.targetClient}</p>

      <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end justify-center gap-6 sm:justify-start">
          <ScoreGauge
            label="Score global"
            value={opportunity.scores.opportunity}
            max={100}
            size="lg"
            showMax
          />
          {subGauges.map((g, i) => (
            <ScoreGauge key={g.label} {...g} size="sm" delay={i * 0.08} />
          ))}
        </div>
        <div>
          <p className="text-sm text-map-muted">Revenu possible</p>
          <p className="mt-1 font-display text-3xl font-medium tabular-nums">
            {formatCurrency(opportunity.revenueMin)}–{formatCurrency(opportunity.revenueMax)}
            <span className="text-lg text-map-muted"> /mois</span>
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-map-border pt-6">
        <Button size="lg" asChild>
          <Link href="#why">
            Commencer par l&apos;étape 1
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
          asChild
        >
          <Link href="#prompt">Voir le prompt Claude Code</Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
          asChild
        >
          <Link href="#guide">Voir le guide complet pour construire ce SaaS</Link>
        </Button>
      </div>
    </header>
  );
}

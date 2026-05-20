"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Opportunity } from "@/types/opportunity";
import { ScoreGauge } from "@/components/scores/score-gauge";
import { formatCurrency } from "@/lib/utils";
import { sectorLabels } from "@/data/opportunities";
import { getFranceCompetitionLabel } from "@/components/opportunities/detail/detail-sections";

export function DetailHero({ opportunity }: { opportunity: Opportunity }) {
  const sectorLabel = sectorLabels[opportunity.sector] ?? opportunity.sector;
  const subGauges = [
    { label: "Adapté France", value: opportunity.scores.franceFit, max: 10 },
    { label: "Facile à créer", value: opportunity.scores.buildability, max: 10 },
    { label: "Rentabilité", value: opportunity.scores.margin, max: 10 },
    { label: "Peu de concurrence", value: opportunity.scores.competitionGap, max: 10 },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl bg-hero px-6 pb-9 pt-4 text-hero-foreground sm:px-10 sm:pb-10 sm:pt-5"
    >
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

      <div className="mt-8 flex flex-col items-center gap-8 lg:flex-row lg:items-center">
        <div className="flex w-full min-w-0 flex-row flex-wrap items-end justify-center gap-6 lg:flex-1 lg:justify-start">
          <ScoreGauge
            label="Score global"
            value={opportunity.scores.opportunity}
            max={100}
            diameter={80}
            showMax
          />
          {subGauges.map((g, i) => (
            <ScoreGauge key={g.label} {...g} diameter={64} delay={i * 0.08} />
          ))}
        </div>

        <div className="w-full shrink-0 rounded-2xl border border-gray-700 bg-gray-900 p-6 lg:ml-auto lg:w-auto lg:min-w-[260px]">
          <p className="mb-2 text-sm text-gray-400">Potentiel estimé</p>
          <p className="whitespace-nowrap text-3xl font-bold text-white">
            {formatCurrency(opportunity.revenueMin)} – {formatCurrency(opportunity.revenueMax)}
          </p>
          <p className="mt-1 text-sm text-gray-400">/mois</p>
          <hr className="my-3 border-gray-700" />
          <p className="flex items-center gap-2 text-sm text-green-400">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-400" aria-hidden />
            {getFranceCompetitionLabel(opportunity)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="#paywall"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Voir le guide complet
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="#pourquoi"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-600 px-6 py-3 text-base font-medium text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
        >
          Pourquoi ça marche
        </Link>
      </div>
    </motion.header>
  );
}

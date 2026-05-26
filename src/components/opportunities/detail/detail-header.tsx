"use client";

import { motion } from "framer-motion";
import type { Opportunity } from "@/types/opportunity";
import { getFranceCompetitionLabel } from "@/components/opportunities/detail/detail-sections";
import { ScoreCircle } from "@/components/opportunities/detail/score-circle";

export function DetailHeader({ opportunity }: { opportunity: Opportunity }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 mt-4"
    >
      <h1 className="mb-2 text-4xl font-bold text-white">{opportunity.name}</h1>
      <p className="mb-1 text-xl text-gray-300">{opportunity.pitch}</p>
      <p className="text-sm text-gray-500">Pour : {opportunity.targetClient}</p>

      <div className="mt-6 flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex flex-row flex-wrap items-end gap-6">
          <ScoreCircle
            value={opportunity.scores.opportunity}
            max={100}
            size={80}
            label="Score global"
          />
          <ScoreCircle
            value={opportunity.scores.franceFit}
            max={10}
            size={64}
            label="Adapté France"
            delay={0.08}
          />
          <ScoreCircle
            value={opportunity.scores.buildability}
            max={10}
            size={64}
            label="Facile à créer"
            delay={0.16}
          />
          <ScoreCircle
            value={opportunity.scores.margin}
            max={10}
            size={64}
            label="Rentabilité"
            delay={0.24}
          />
          <ScoreCircle
            value={opportunity.scores.competitionGap}
            max={10}
            size={64}
            label="Concurrence"
            delay={0.32}
          />
        </div>

        <div className="min-w-[240px] rounded-2xl border border-gray-700 bg-gray-900 p-5 lg:ml-auto">
          <p className="mb-1 text-xs text-gray-500">Potentiel estimé</p>
          <p className="text-2xl font-bold text-white">
            {opportunity.revenueMin.toLocaleString("fr-FR")} € –{" "}
            {opportunity.revenueMax.toLocaleString("fr-FR")} €
          </p>
          <p className="text-sm text-gray-500">/mois</p>
          <hr className="my-3 border-gray-800" />
          <p className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {getFranceCompetitionLabel(opportunity)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

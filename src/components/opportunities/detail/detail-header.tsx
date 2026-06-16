"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { getFranceCompetitionLabel } from "@/components/opportunities/detail/detail-sections";
import { ScoreCircle } from "@/components/opportunities/detail/score-circle";
import { BuildOpportunityCta } from "@/components/cockpit/build-opportunity-cta";
import { FavoriteButton } from "@/components/opportunities/favorite-button";
import { SCORE_WEIGHTS } from "@/lib/sourcing/constants";

export type DetailHeaderMeta = {
  publishedAt?: string;
  sourceVerified?: boolean;
  showOriginalLink?: boolean;
  showScoreBreakdown?: boolean;
  hideCta?: boolean;
};

export function DetailHeader({
  opportunity,
  meta,
}: {
  opportunity: Opportunity;
  meta?: DetailHeaderMeta;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 mt-4 overflow-visible"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          Analysé par Radar
        </span>
        {meta?.sourceVerified && (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
            Source vérifiée
          </span>
        )}
        {meta?.publishedAt && (
          <span className="text-xs text-muted-foreground">
            Ajouté le{" "}
            {new Date(meta.publishedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      <h1 className="mb-2 text-4xl font-bold text-foreground">{opportunity.name}</h1>
      <p className="mb-1 text-xl text-foreground/80">{opportunity.pitch}</p>
      <p className="text-sm text-muted-foreground">Pour : {opportunity.targetClient}</p>

      {meta?.showOriginalLink && opportunity.url && (
        <p className="mt-3">
          <Link
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Voir le produit original
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </p>
      )}

      <div className="mt-6 flex flex-col items-start gap-6 overflow-visible lg:flex-row">
        <div className="flex flex-row flex-wrap items-end gap-6 overflow-visible">
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

        <div className="min-w-[240px] rounded-2xl border border-border bg-card p-5 lg:ml-auto">
          <p className="mb-1 text-xs text-muted-foreground">Potentiel estimé</p>
          <p className="text-2xl font-bold text-foreground">
            {opportunity.revenueMin.toLocaleString("fr-FR")} € –{" "}
            {opportunity.revenueMax.toLocaleString("fr-FR")} €
          </p>
          <p className="text-sm text-muted-foreground">/mois</p>
          <hr className="my-3 border-border" />
          <p className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {getFranceCompetitionLabel(opportunity)}
          </p>
        </div>
      </div>

      {meta?.showScoreBreakdown && (
        <div className="mt-6 rounded-xl border border-border bg-card/50 p-4">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Pondération du score
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["franceFit", "Adapté France", SCORE_WEIGHTS.franceFit],
                ["competitionGap", "Concurrence", SCORE_WEIGHTS.competitionGap],
                ["margin", "Rentabilité", SCORE_WEIGHTS.margin],
                ["buildability", "Buildabilité", SCORE_WEIGHTS.buildability],
              ] as const
            ).map(([key, label, weight]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-muted-foreground">{label}</span>
                <div className="h-1.5 flex-1 rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(opportunity.scores[key] / 10) * 100}%` }}
                  />
                </div>
                <span className="tabular-nums">{opportunity.scores[key]}/10</span>
                <span className="text-muted-foreground">×{weight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <FavoriteButton slug={opportunity.slug} size="md" variant="pill" />
        {!meta?.hideCta && (
          <div className="hidden sm:block">
            <BuildOpportunityCta opportunity={opportunity} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

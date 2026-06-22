"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { getFranceCompetitionLabel } from "@/components/opportunities/detail/detail-sections";
import { ScoreCircle } from "@/components/opportunities/detail/score-circle";
import { BuildOpportunityCta } from "@/components/cockpit/build-opportunity-cta";
import { FavoriteButton } from "@/components/opportunities/favorite-button";
import { isDiscoveryPhase } from "@/lib/product-phase";
import {
  SCORE_AXIS_LABELS,
  SCORE_AXIS_TOOLTIPS,
  SCORE_GLOBAL_TOOLTIP,
  SUB_SCORE_KEYS,
} from "@/lib/scoring/rubric";
import { cn } from "@/lib/utils";

export type DetailHeaderMeta = {
  publishedAt?: string;
  sourceVerified?: boolean;
  showOriginalLink?: boolean;
  hideCta?: boolean;
};

export function DetailHeader({
  opportunity,
  meta,
  existingProjectId = null,
}: {
  opportunity: Opportunity;
  meta?: DetailHeaderMeta;
  existingProjectId?: string | null;
}) {
  const discovery = isDiscoveryPhase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn("overflow-visible", discovery ? "mb-6 mt-0" : "mb-8 mt-4")}
    >
      {!discovery ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Analysé par Build Road
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
      ) : meta?.sourceVerified ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
            Source vérifiée
          </span>
        </div>
      ) : null}

      <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">{opportunity.name}</h1>
      <p className="mb-1 text-lg text-foreground/80 sm:text-xl">{opportunity.pitch}</p>
      <p className="text-sm text-muted-foreground">
        <span className="text-foreground/80">Clients :</span> {opportunity.targetClient}
      </p>

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
        <div className="-mx-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0">
          <div className="shrink-0 snap-start">
            <ScoreCircle
              value={opportunity.scores.opportunity}
              max={100}
              size={80}
              label={SCORE_AXIS_LABELS.opportunity}
              tooltip={SCORE_GLOBAL_TOOLTIP}
            />
          </div>
          {SUB_SCORE_KEYS.map((key, index) => (
            <div key={key} className="shrink-0 snap-start">
              <ScoreCircle
                value={opportunity.scores[key]}
                max={10}
                size={64}
                label={SCORE_AXIS_LABELS[key]}
                tooltip={SCORE_AXIS_TOOLTIPS[key]}
                delay={(index + 1) * 0.08}
              />
            </div>
          ))}
        </div>

        <div className="w-full min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5 lg:ml-auto lg:min-w-[240px] lg:w-auto">
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

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {!discovery ? (
          <FavoriteButton slug={opportunity.slug} size="md" variant="pill" />
        ) : null}
        {!meta?.hideCta && (
          <BuildOpportunityCta
            opportunity={opportunity}
            existingProjectId={existingProjectId}
          />
        )}
      </div>
    </motion.div>
  );
}

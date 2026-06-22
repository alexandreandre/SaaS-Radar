"use client";

import { useState } from "react";
import type { Opportunity } from "@/types/opportunity";
import { hasMajorCoherenceAdjustment } from "@/lib/scoring/coherence";
import {
  SCORE_AXIS_LABELS,
  SCORE_WEIGHTS,
  SUB_SCORE_KEYS,
} from "@/lib/scoring/rubric";
import { DetailHeader } from "@/components/opportunities/detail/detail-header";
import { DetailContent } from "@/components/opportunities/detail/detail-content";
import { enrichOpportunity } from "@/data/opportunity-enrichment";
import { sectorLabels } from "@/data/opportunities";

function editorialFieldKeys(opp: Opportunity): string[] {
  const enriched = enrichOpportunity(opp);
  const keys: string[] = [];
  if (!opp.frenchCompetitors?.length && enriched.frenchCompetitors?.length) {
    keys.push("frenchCompetitors");
  }
  if (!opp.launchTimeline?.length && enriched.launchTimeline?.length) {
    keys.push("launchTimeline");
  }
  if (!opp.emailTemplates?.length && enriched.emailTemplates?.length) {
    keys.push("emailTemplates");
  }
  if (!opp.foreignMarketProfile && enriched.foreignMarketProfile) {
    keys.push("foreignMarketProfile");
  }
  return keys;
}

const VERIFICATION_LABELS: Record<string, string> = {
  none: "Aucune",
  partial: "Partielle",
  full: "Complète",
};

export function DraftPreviewPanel({
  draft,
  onRunClick,
}: {
  draft: {
    payload: Opportunity;
    score: number | null;
    source_verified?: boolean | null;
    verification_level?: string | null;
    premium_verified?: boolean | null;
    invalid_urls?: string[] | unknown;
    source_run_id?: string | null;
    dedup_matches?: unknown[];
  };
  onRunClick?: (runId: string) => void;
}) {
  const opp = draft.payload;
  const editorial = editorialFieldKeys(opp);
  const invalidUrls = Array.isArray(draft.invalid_urls)
    ? (draft.invalid_urls as string[])
    : [];
  const meta = opp.scores._meta;
  const [showRationales, setShowRationales] = useState(false);
  const majorAdjustment = meta?.adjustments ? hasMajorCoherenceAdjustment(meta.adjustments) : false;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <strong className="text-foreground">Pays :</strong> {opp.originCountryCode}
          </span>
          <span>
            <strong className="text-foreground">Secteur :</strong>{" "}
            {sectorLabels[opp.sector] ?? opp.sector}
          </span>
          {draft.verification_level && (
            <span>
              <strong className="text-foreground">Vérif. :</strong>{" "}
              {VERIFICATION_LABELS[draft.verification_level] ?? draft.verification_level}
            </span>
          )}
          {draft.source_run_id && (
            <span>
              <strong className="text-foreground">Run :</strong>{" "}
              {onRunClick ? (
                <button
                  type="button"
                  className="font-mono text-primary hover:underline"
                  onClick={() => onRunClick(draft.source_run_id!)}
                >
                  {draft.source_run_id.slice(0, 8)}…
                </button>
              ) : (
                <span className="font-mono">{draft.source_run_id.slice(0, 8)}…</span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
          Analysé par Build Road
        </span>
        {draft.source_verified && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">
            Source vérifiée
          </span>
        )}
        {draft.premium_verified && (
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-700">
            Premium vérifié
          </span>
        )}
        {editorial.length > 0 && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">
            Complété éditorialement ({editorial.length} section(s))
          </span>
        )}
        {majorAdjustment && (
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-700">
            Correction cohérence &gt; 1.5 pt
          </span>
        )}
      </div>

      {invalidUrls.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
          <p className="font-medium text-amber-800">URLs invalides ({invalidUrls.length})</p>
          <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto text-muted-foreground">
            {invalidUrls.map((url) => (
              <li key={url} className="truncate font-mono">
                {url}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">Score décomposé (admin)</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Score Build Road hybride — 60 % analyse pondérée + 40 % qualité des sources
        </p>
        <div className="mt-2 space-y-2">
          {SUB_SCORE_KEYS.map((key) => {
            const val = opp.scores[key];
            const weight = SCORE_WEIGHTS[key];
            const raw = meta?.rawSubScores?.[key];
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 text-muted-foreground">{SCORE_AXIS_LABELS[key]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(val / 10) * 100}%` }}
                  />
                </div>
                <span className="w-14 tabular-nums">
                  {val}/10
                  {raw != null && raw !== val ? (
                    <span className="text-muted-foreground"> ({raw})</span>
                  ) : null}
                </span>
                <span className="w-10 text-muted-foreground">×{weight}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
          <p>
            <span className="text-foreground">Analyse pondérée :</span>{" "}
            {meta?.geminiWeighted ?? "—"}/100
          </p>
          <p>
            <span className="text-foreground">Score faits :</span> {meta?.factsScore ?? "—"}/100
          </p>
          <p className="font-medium text-foreground tabular-nums">
            Global : {draft.score ?? opp.scores.opportunity}/100
          </p>
        </div>
        {meta?.adjustments && meta.adjustments.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-[11px] text-amber-800">
            {meta.adjustments.map((line) => (
              <li key={line}>↳ {line}</li>
            ))}
          </ul>
        )}
        {meta?.subScoreRationales && (
          <div className="mt-3">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setShowRationales((v) => !v)}
            >
              {showRationales ? "Masquer" : "Voir"} les justifications Gemini
            </button>
            {showRationales && (
              <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                {SUB_SCORE_KEYS.map((key) => (
                  <li key={key}>
                    <strong className="text-foreground">{SCORE_AXIS_LABELS[key]} :</strong>{" "}
                    {meta.subScoreRationales?.[key]}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border">
        <DetailHeader
          opportunity={enrichOpportunity(opp)}
          meta={{ showOriginalLink: true, sourceVerified: !!draft.source_verified }}
        />
        <div className="px-4 pb-6">
          <DetailContent opportunity={enrichOpportunity(opp)} variant="embedded" />
        </div>
      </div>
    </div>
  );
}

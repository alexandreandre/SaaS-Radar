"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import {
  DEDUP_TYPE_LABELS,
  type DedupMatch,
} from "@/lib/admin/sourcing-dedup.shared";
import {
  effectiveDedupMatches,
  type OpportunityDraftRow,
} from "@/lib/admin/draft-types.shared";
import { sectorLabels } from "@/data/opportunities";
import { cn } from "@/lib/utils";

function FactConfidenceBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const styles =
    level === "low"
      ? "bg-red-500/10 text-red-700"
      : level === "medium"
        ? "bg-amber-500/10 text-amber-800"
        : "bg-emerald-500/10 text-emerald-700";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles)}>
      Confiance faits : {level}
    </span>
  );
}

function DedupMatchLine({ match }: { match: DedupMatch }) {
  const label = DEDUP_TYPE_LABELS[match.type] ?? match.type;
  const sourceLabel =
    match.source === "pending_draft"
      ? "brouillon pending"
      : match.source === "catalogue"
        ? "catalogue publié"
        : null;

  return (
    <li className="text-xs">
      <span className="font-medium text-foreground">{label}</span>
      {match.similarity != null && (
        <span className="text-muted-foreground"> ({Math.round(match.similarity * 100)} %)</span>
      )}
      {sourceLabel && (
        <span className="text-muted-foreground"> — {sourceLabel}</span>
      )}
      {match.existingSlug && match.source === "catalogue" && (
        <>
          {" "}
          <Link
            href={`/opportunities/${match.existingSlug}`}
            className="text-primary hover:underline"
            target="_blank"
          >
            {match.existingSlug}
          </Link>
        </>
      )}
      {match.existingSlug && match.source === "pending_draft" && (
        <span className="font-mono text-muted-foreground"> → {match.existingSlug}</span>
      )}
    </li>
  );
}

function ReviewCollapsible({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
}

export function DraftReviewAlerts({ draft }: { draft: OpportunityDraftRow }) {
  const opp = draft.payload;
  const dedupMatches = effectiveDedupMatches(draft);
  const critical =
    draft.needs_review || draft.fact_confidence === "low";
  const warning =
    !critical &&
    (draft.fact_confidence === "medium" ||
      draft.invalid_urls.length > 0 ||
      dedupMatches.length > 0);

  return (
    <div className="space-y-3">
      {(critical || warning) && (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            critical
              ? "border-red-500/40 bg-red-500/5 text-red-900"
              : "border-amber-500/40 bg-amber-500/5 text-amber-900"
          )}
        >
          <p className="font-medium">
            {critical ? "Relecture prioritaire" : "Points d'attention"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {draft.needs_review && (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs">
                needs_review
              </span>
            )}
            <FactConfidenceBadge level={draft.fact_confidence} />
            {dedupMatches.length > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs">
                {dedupMatches.length} doublon(s) détecté(s)
              </span>
            )}
          </div>
        </div>
      )}

      {dedupMatches.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
          <p className="font-medium text-amber-900">Doublons (catalogue + brouillons pending)</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {dedupMatches.map((m, i) => (
              <DedupMatchLine key={`${m.type}-${m.value}-${i}`} match={m} />
            ))}
          </ul>
        </div>
      )}

      <ReviewCollapsible title="À relire avec attention" defaultOpen={critical}>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Traction (sourceUrl à vérifier)
            </p>
            <ul className="mt-2 space-y-2">
              {opp.tractionSignals.length === 0 ? (
                <li className="text-xs text-muted-foreground">Aucun signal</li>
              ) : (
                opp.tractionSignals.map((signal) => (
                  <li
                    key={`${signal.label}-${signal.value}`}
                    className="rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs"
                  >
                    <p className="font-medium text-foreground">
                      {signal.label} — {signal.value}
                    </p>
                    {signal.sourceUrl ? (
                      <a
                        href={signal.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {signal.source}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <p className="mt-1 text-muted-foreground">Source : {signal.source}</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          {(opp.frenchCompetitors?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-medium uppercase text-amber-800">
                Concurrents FR — non vérifiés par fact-check
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pricing et positionnement à confirmer manuellement.
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {opp.frenchCompetitors!.map((c) => (
                  <li key={c.name}>
                    <strong>{c.name}</strong> — {c.pricing} · {c.positioning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Projections financières — pas des faits sourcés
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Scénarios Build Road pour un solo dev en France (12–18 mois), pas les revenus du
              SaaS source.
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {opp.financialScenarios.map((s) => (
                <li key={s.name}>
                  <strong>{s.name}</strong> — {s.clients} clients × {s.avgPrice} €/mois (MRR ~
                  {s.clients * s.avgPrice} €)
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Secteur : {sectorLabels[opp.sector] ?? opp.sector} · Pays : {opp.originCountryCode}
          </p>
        </div>
      </ReviewCollapsible>
    </div>
  );
}

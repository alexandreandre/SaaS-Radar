"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ExternalLink, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Opportunity, WhyItWorksItem } from "@/types/opportunity";
import { getWhyItWorksFact } from "@/types/opportunity";
import { getWhyItWorksSources } from "@/components/opportunities/detail/detail-sections";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface WhySectionProps {
  opportunity: Opportunity;
  animationIndex: number;
  variant?: "detail" | "playbook";
}

const PROOF_LABELS = ["Marché", "Modèle validé", "Timing France"] as const;

function resolveProofLabel(index: number): string {
  return PROOF_LABELS[index] ?? `Preuve ${index + 1}`;
}

function resolveSource(
  item: WhyItWorksItem,
  index: number,
  fallbackSources: string[],
): { label: string; url?: string } | null {
  const source = typeof item === "object" ? item.source : null;
  const sourceUrl = typeof item === "object" ? item.sourceUrl : undefined;
  const label = source ?? fallbackSources[index];

  if (!label) return null;
  return { label, url: sourceUrl };
}

function SourceLine({ label, url }: { label: string; url?: string }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-blue-400"
      >
        Source : {label}
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
    );
  }

  return <p className="text-xs italic text-muted-foreground/60">Source : {label}</p>;
}

function PlaybookWhyList({
  opportunity,
  fallbackSources,
}: {
  opportunity: Opportunity;
  fallbackSources: string[];
}) {
  return (
    <>
      <ul className="divide-y divide-border/50 overflow-hidden rounded-lg border border-border/40 bg-background/60">
        {opportunity.whyItWorks.map((item, i) => {
          const fact = getWhyItWorksFact(item);
          const detail = typeof item === "object" ? item.detail : null;
          const source = resolveSource(item, i, fallbackSources);
          const showChiffresLink = i === 1 && opportunity.tractionSignals.length > 0;

          return (
            <li key={i} className="flex gap-3 px-3 py-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                aria-hidden
              >
                ✓
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {resolveProofLabel(i)}
                </p>
                <p className="text-sm leading-snug text-foreground/90">{fact}</p>
                {detail ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {source ? <SourceLine label={source.label} url={source.url} /> : null}
                  {showChiffresLink ? (
                    <Link
                      href="#chiffres"
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      Voir les chiffres ↑
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function DetailWhyAccordion({
  opportunity,
  fallbackSources,
}: {
  opportunity: Opportunity;
  fallbackSources: string[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        Les faits qui prouvent que ce marché est réel — et que la fenêtre est ouverte
      </p>

      <div className="space-y-2">
        {opportunity.whyItWorks.map((item, i) => {
          const isOpen = openIndex === i;
          const panelId = `${baseId}-panel-${i}`;
          const fact = getWhyItWorksFact(item);
          const detail = typeof item === "object" ? item.detail : null;
          const source = resolveSource(item, i, fallbackSources);
          const showChiffresLink = i === 1 && opportunity.tractionSignals.length > 0;

          return (
            <div
              key={i}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                isOpen ? "border-border bg-card" : "border-border bg-muted/20 hover:border-border",
              )}
            >
              <button
                type="button"
                id={`${baseId}-trigger-${i}`}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <span className="w-8 shrink-0 text-2xl font-black tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {resolveProofLabel(i)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90">{fact}</p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {isOpen ? (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={`${baseId}-trigger-${i}`}
                  className="border-t border-border px-5 pb-5"
                >
                  <div className="space-y-3 pl-[4.25rem] pt-4">
                    {detail ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {source ? <SourceLine label={source.label} url={source.url} /> : null}
                      {showChiffresLink ? (
                        <Link
                          href="#chiffres"
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          Voir les chiffres ↑
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function WhySection({
  opportunity,
  animationIndex,
  variant = "detail",
}: WhySectionProps) {
  const isPlaybook = variant === "playbook";
  const fallbackSources = getWhyItWorksSources(opportunity);
  const proofCount = opportunity.whyItWorks.length;
  const proofSubtitle = `${proofCount} preuve${proofCount > 1 ? "s" : ""} vérifiée${proofCount > 1 ? "s" : ""} — fenêtre ouverte en France`;

  return (
    <AnimatedSection
      id="pourquoi"
      animationIndex={animationIndex}
      className={cn(isPlaybook ? "mb-0" : "mb-12 scroll-mt-24")}
    >
      <SectionTitle
        number={isPlaybook ? 3 : 4}
        title="Pourquoi ça marche"
        subtitle={isPlaybook ? proofSubtitle : undefined}
        variant={isPlaybook ? "playbook" : "detail"}
      />

      {isPlaybook ? (
        <PlaybookWhyList opportunity={opportunity} fallbackSources={fallbackSources} />
      ) : (
        <DetailWhyAccordion opportunity={opportunity} fallbackSources={fallbackSources} />
      )}
    </AnimatedSection>
  );
}

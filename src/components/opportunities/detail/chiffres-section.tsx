"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Opportunity, TractionSignal } from "@/types/opportunity";
import { AnimatedMetricValue } from "@/components/opportunities/detail/animated-metric-value";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";
import {
  getFranceEncartContent,
  getTractionSignalDescription,
} from "@/components/opportunities/detail/detail-sections";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import {
  CHIFFRES_ROW_CATEGORIES,
  resolveChiffresSignals,
  resolveSignalKind,
  slotSignalsByCategory,
  type TractionCategory,
} from "@/lib/traction-signals";
import { cn } from "@/lib/utils";

interface ChiffresSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
  variant?: "detail" | "playbook";
}

function TractionSource({
  signal,
  align = "end",
  prominent = false,
}: {
  signal?: TractionSignal;
  align?: "start" | "end";
  prominent?: boolean;
}) {
  if (!signal?.source) return null;

  const className = cn(
    "mt-1 flex items-center gap-1 text-xs transition-colors hover:text-blue-400",
    prominent ? "font-medium text-muted-foreground" : "text-muted-foreground/60",
    align === "end" ? "justify-end" : "justify-start"
  );

  if (signal.sourceUrl) {
    return (
      <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className={className}>
        Source : {signal.source}
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
    );
  }

  return <p className={className}>Source : {signal.source}</p>;
}

function TractionRow({
  opportunity,
  signal,
  category,
  animateMetric = false,
  grouped = false,
}: {
  opportunity: Opportunity;
  signal?: TractionSignal;
  category: (typeof CHIFFRES_ROW_CATEGORIES)[number];
  animateMetric?: boolean;
  grouped?: boolean;
}) {
  const description = signal
    ? getTractionSignalDescription(opportunity, signal)
    : category.subtitle;
  const kind = signal ? resolveSignalKind(signal) : null;
  const showDataLabel =
    signal?.label &&
    !/mrr|revenu|arr|revenue|chiffre/i.test(signal.label) &&
    signal.label !== category.title;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-4",
        !grouped && "border-b border-border py-5",
      )}
    >
      <div className="min-w-0 sm:max-w-[45%]">
        <p className="text-lg font-semibold text-foreground">{category.title}</p>
        {showDataLabel ? (
          <p className="mt-0.5 text-xs text-muted-foreground/70">{signal.label}</p>
        ) : null}
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="min-w-0 sm:max-w-[52%] sm:text-right">
        {!signal ? (
          <p className="text-sm italic text-muted-foreground">
            {category.title.startsWith("Revenu") ? "MRR non sourcé" : "Signal non sourcé"}
          </p>
        ) : kind === "metric" ? (
          <>
            {animateMetric ? (
              <AnimatedMetricValue value={signal.value} className={category.metricColor} />
            ) : (
              <p className={cn("text-3xl font-black sm:text-4xl", category.metricColor)}>
                {signal.value}
              </p>
            )}
            <TractionSource signal={signal} />
          </>
        ) : (
          <blockquote className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-left sm:text-right">
            <p className="text-sm leading-relaxed text-foreground/90 italic">{signal.value}</p>
            <TractionSource signal={signal} align="end" prominent />
          </blockquote>
        )}
      </div>
    </div>
  );
}

function ExtraTractionRow({
  opportunity,
  signal,
}: {
  opportunity: Opportunity;
  signal: TractionSignal;
}) {
  const kind = resolveSignalKind(signal);

  return (
    <div className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 sm:max-w-[45%]">
        <p className="text-lg font-semibold text-foreground">{signal.label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {getTractionSignalDescription(opportunity, signal)}
        </p>
      </div>
      <div className="min-w-0 sm:max-w-[52%] sm:text-right">
        {kind === "metric" ? (
          <>
            <p className="text-3xl font-black text-foreground/90 sm:text-4xl">{signal.value}</p>
            <TractionSource signal={signal} />
          </>
        ) : (
          <blockquote className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-left sm:text-right">
            <p className="text-sm leading-relaxed text-foreground/90 italic">{signal.value}</p>
            <TractionSource signal={signal} align="end" prominent />
          </blockquote>
        )}
      </div>
    </div>
  );
}

const CHIFFRES_CATEGORY_KEYS: TractionCategory[] = ["mrr", "authority", "community"];

export function ChiffresSection({
  opportunity,
  animationIndex,
  variant = "detail",
}: ChiffresSectionProps) {
  const isPlaybook = variant === "playbook";
  const signals = resolveChiffresSignals(opportunity);
  const slotted = slotSignalsByCategory(signals);
  const primarySignals = CHIFFRES_CATEGORY_KEYS.map((key) => slotted[key]);
  const extraSignals = slotted.extras;
  const franceEncart = getFranceEncartContent(opportunity);
  const hasFranceAnalysis = Boolean(opportunity.franceAnalysis[0]?.trim());

  return (
    <AnimatedSection
      id="chiffres"
      animationIndex={animationIndex}
      className={cn(isPlaybook ? "mb-0" : "mb-12 scroll-mt-24")}
    >
      <SectionTitle
        number={2}
        title={
          isPlaybook
            ? `Ce que gagne le concurrent ${opportunity.originFlag}`
            : `Ce que gagne déjà le concurrent ${opportunity.originFlag} 💰`
        }
        subtitle={
          isPlaybook
            ? `${opportunity.foreignInspiration} — actif ${opportunity.originCountry}, pas encore structuré en France.`
            : undefined
        }
        variant={isPlaybook ? "playbook" : "detail"}
      />

      {!isPlaybook ? (
        <p className="mb-8 text-base leading-relaxed text-foreground/80">
          <span className="font-semibold text-foreground">{opportunity.foreignInspiration}</span>
          {` est déjà actif sur le marché ${opportunity.originCountry}. Voici ce qu'ils font chaque mois — et pourquoi personne ne l'a encore structuré en France.`}
        </p>
      ) : null}

      <div
        className={cn(
          isPlaybook && "overflow-hidden rounded-lg border border-border/40 bg-muted/10 divide-y divide-border/50",
        )}
      >
        {CHIFFRES_ROW_CATEGORIES.map((category, index) => (
          <TractionRow
            key={category.title}
            opportunity={opportunity}
            signal={primarySignals[index] ?? undefined}
            category={category}
            animateMetric={index === 0}
            grouped={isPlaybook}
          />
        ))}
      </div>

      <div
        className={cn(
          "rounded-xl border border-green-800/30 bg-green-950/20",
          isPlaybook ? "mt-4 p-3.5" : "mt-6 p-5",
        )}
      >
        <p className={cn("mb-1 text-sm font-semibold text-green-400", isPlaybook && "text-green-500/90")}>
          {isPlaybook ? "Et en France ?" : "🇫🇷 Et en France ?"}
        </p>
        {hasFranceAnalysis ? (
          <p className="text-sm leading-relaxed text-foreground/80">{franceEncart.body}</p>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/80">
            Concurrence{" "}
            <span className="font-medium text-foreground">{franceEncart.competitionLabel}</span>.{" "}
            {franceEncart.body}
          </p>
        )}
      </div>

      {extraSignals.map((signal) => (
        <div key={`${signal.label}-${signal.value}`} className={cn(isPlaybook && "mt-3 overflow-hidden rounded-lg border border-border/40 bg-muted/10")}>
          <ExtraTractionRow opportunity={opportunity} signal={signal} />
        </div>
      ))}

      {extraSignals.length > 2 ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link
            href={`/opportunities/${opportunity.slug}#chiffres`}
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            Voir tous les signaux en plein écran
          </Link>
        </p>
      ) : null}
    </AnimatedSection>
  );
}

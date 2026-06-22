import type { Opportunity } from "@/types/opportunity";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { sectorLabels } from "@/data/opportunities";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface OpportunitySectionProps {
  opportunity: Opportunity;
  animationIndex: number;
  variant?: "detail" | "playbook";
}

function signalColorClass(color: "blue", compact = false) {
  return cn(
    compact ? "rounded px-1.5 py-px text-[11px] font-semibold" : "rounded-lg px-2 py-0.5 text-sm font-semibold",
    color === "blue" && "bg-blue-500/15 text-blue-400",
  );
}

function PlaybookEnBref({
  opportunity,
  sectorLabel,
  clientTypeLabel,
}: {
  opportunity: Opportunity;
  sectorLabel: string;
  clientTypeLabel: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-primary/10 px-1.5 py-px text-[11px] font-medium text-primary">
          {sectorLabel}
        </span>
        <span className={signalColorClass("blue", true)}>{clientTypeLabel}</span>
        {opportunity.aiPowered ? (
          <span className="rounded bg-violet-500/10 px-1.5 py-px text-[11px] font-medium text-violet-400">
            IA
          </span>
        ) : null}
        {opportunity.boringBusiness ? (
          <span className="rounded bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground">
            Boring
          </span>
        ) : null}
      </div>

      <p className="text-sm leading-snug text-foreground">{opportunity.targetClient}</p>

      {opportunity.url ? (
        <a
          href={opportunity.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          <span className="line-clamp-1">Original · {opportunity.foreignInspiration}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : null}
    </div>
  );
}

export function OpportunitySection({
  opportunity,
  animationIndex,
  variant = "detail",
}: OpportunitySectionProps) {
  const isPlaybook = variant === "playbook";
  const sectorLabel = sectorLabels[opportunity.sector] ?? opportunity.sector;
  const clientTypeLabel = opportunity.clientType === "b2b" ? "B2B" : "B2C";

  if (isPlaybook) {
    return (
      <AnimatedSection id="opportunite" animationIndex={animationIndex} className="mb-0">
        <SectionTitle
          number={1}
          title="En bref"
          subtitle="Cible et positionnement"
          variant="playbook"
        />
        <PlaybookEnBref
          opportunity={opportunity}
          sectorLabel={sectorLabel}
          clientTypeLabel={clientTypeLabel}
        />
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection id="opportunite" animationIndex={animationIndex} className="mb-12 scroll-mt-24">
      <SectionTitle number={1} title="En bref" />
      <p className="mb-4 text-sm text-muted-foreground">
        Cible et positionnement — les scores détaillés sont dans l&apos;en-tête
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="min-w-0 flex-1 text-base leading-relaxed text-foreground">{opportunity.pitch}</p>
          <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {sectorLabel}
          </span>
        </div>

        {(opportunity.aiPowered || opportunity.boringBusiness) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {opportunity.aiPowered ? (
              <span className="rounded-lg bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-400">
                Propulsé par l&apos;IA
              </span>
            ) : null}
            {opportunity.boringBusiness ? (
              <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Boring business
              </span>
            ) : null}
          </div>
        )}

        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Client cible</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-base font-medium text-foreground">{opportunity.targetClient}</p>
            <span className={signalColorClass("blue")}>{clientTypeLabel}</span>
          </div>
        </div>

        {opportunity.url ? (
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <span>Voir {opportunity.foreignInspiration}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ) : null}
      </div>
    </AnimatedSection>
  );
}

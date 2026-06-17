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

type SignalColor = "green" | "yellow" | "red" | "blue";

function signalColorClass(color: SignalColor, compact = false) {
  return cn(
    compact ? "rounded px-1.5 py-px text-[11px] font-semibold" : "rounded-lg px-2 py-0.5 text-sm font-semibold",
    color === "green" && "bg-green-500/15 text-green-400",
    color === "yellow" && "bg-yellow-500/15 text-yellow-400",
    color === "red" && "bg-red-500/15 text-red-400",
    color === "blue" && "bg-blue-500/15 text-blue-400",
  );
}

function SignalCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: SignalColor;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1">
        <span className={signalColorClass(color)}>{value}</span>
      </p>
    </div>
  );
}

function SignalInline({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: SignalColor;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <span>{label}</span>
      <span className={signalColorClass(color, true)}>{value}</span>
    </span>
  );
}

function resolveComplexity(opportunity: Opportunity): { label: string; color: SignalColor } {
  if (opportunity.techComplexity === "low") return { label: "Faible", color: "green" };
  if (opportunity.techComplexity === "medium") return { label: "Moyenne", color: "yellow" };
  return { label: "Élevée", color: "red" };
}

function resolveLaunchTime(opportunity: Opportunity): { label: string; color: SignalColor } {
  return opportunity.buildableUnder30Days
    ? { label: "< 30 j", color: "green" }
    : { label: "30-60 j", color: "yellow" };
}

function resolveCompetition(opportunity: Opportunity): { label: string; color: SignalColor } {
  if (opportunity.franceCompetition === "none") return { label: "Aucune", color: "green" };
  if (opportunity.franceCompetition === "low") return { label: "Faible", color: "green" };
  if (opportunity.franceCompetition === "medium") return { label: "Moyenne", color: "yellow" };
  return { label: "Élevée", color: "red" };
}

function PlaybookEnBref({
  opportunity,
  sectorLabel,
  clientTypeLabel,
  complexity,
  launchTime,
  competition,
}: {
  opportunity: Opportunity;
  sectorLabel: string;
  clientTypeLabel: string;
  complexity: { label: string; color: SignalColor };
  launchTime: { label: string; color: SignalColor };
  competition: { label: string; color: SignalColor };
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

      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border/60 pt-2">
        <SignalInline label="Complexité" value={complexity.label} color={complexity.color} />
        <SignalInline label="Lancement" value={launchTime.label} color={launchTime.color} />
        <SignalInline label="Concurrence FR" value={competition.label} color={competition.color} />
      </div>

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
  const complexity = resolveComplexity(opportunity);
  const launchTime = resolveLaunchTime(opportunity);
  const competition = resolveCompetition(opportunity);

  if (isPlaybook) {
    return (
      <AnimatedSection id="opportunite" animationIndex={animationIndex} className="mb-0">
        <SectionTitle
          number={1}
          title="En bref"
          subtitle="Cible, faisabilité et concurrence"
          variant="playbook"
        />
        <PlaybookEnBref
          opportunity={opportunity}
          sectorLabel={sectorLabel}
          clientTypeLabel={clientTypeLabel}
          complexity={complexity}
          launchTime={launchTime}
          competition={competition}
        />
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection id="opportunite" animationIndex={animationIndex} className="mb-12 scroll-mt-24">
      <SectionTitle number={1} title="En bref" />
      <p className="mb-4 text-sm text-muted-foreground">
        Cible, faisabilité et concurrence en France — avant d&apos;aller plus loin
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

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SignalCard label="Complexité technique" value={complexity.label} color={complexity.color} />
          <SignalCard
            label="Délai lancement"
            value={opportunity.buildableUnder30Days ? "< 30 jours" : "30-60 jours"}
            color={launchTime.color}
          />
          <SignalCard label="Concurrence FR" value={competition.label} color={competition.color} />
          <SignalCard label="Type client" value={clientTypeLabel} color="blue" />
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

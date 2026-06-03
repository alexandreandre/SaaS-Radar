import type { Opportunity, TractionSignal } from "@/types/opportunity";
import { ExternalLink } from "lucide-react";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface ChiffresSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

function TractionSource({ signal }: { signal?: TractionSignal }) {
  if (!signal?.source) return null;

  if (signal.sourceUrl) {
    return (
      <a
        href={signal.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-blue-400"
      >
        Source : {signal.source}
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
    );
  }

  return <p className="mt-1 text-xs text-muted-foreground/60">Source : {signal.source}</p>;
}

export function ChiffresSection({ opportunity, animationIndex }: ChiffresSectionProps) {
  const { tractionSignals } = opportunity;

  return (
    <AnimatedSection id="chiffres" animationIndex={animationIndex} className="mb-12 scroll-mt-24">
      <SectionTitle number={2} title="Ce que gagne déjà le concurrent US 💰" />

      <p className="mb-8 text-base leading-relaxed text-foreground/80">
        <span className="font-semibold text-foreground">{opportunity.foreignInspiration}</span> existe
        depuis 3 ans aux États-Unis. Voici ce qu&apos;ils font chaque mois — et pourquoi personne
        ne le fait encore en France.
      </p>

      <div className="flex items-center justify-between border-b border-border py-5">
        <div>
          <p className="text-lg font-semibold text-foreground">Revenu mensuel (MRR)</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Ce qu&apos;ils encaissent chaque mois</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-green-400">{tractionSignals[0]?.value}</p>
          <TractionSource signal={tractionSignals[0]} />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border py-5">
        <div>
          <p className="text-lg font-semibold text-foreground">{tractionSignals[1]?.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Autorité et visibilité en ligne</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-blue-400">{tractionSignals[1]?.value}</p>
          <TractionSource signal={tractionSignals[1]} />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border py-5">
        <div>
          <p className="text-lg font-semibold text-foreground">{tractionSignals[2]?.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Communauté et bouche-à-oreille</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-purple-400">{tractionSignals[2]?.value}</p>
          <TractionSource signal={tractionSignals[2]} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-green-800/30 bg-green-950/20 p-5">
        <p className="mb-1 text-sm font-semibold text-green-400">🇫🇷 Et en France ?</p>
        <p className="text-sm leading-relaxed text-foreground/80">
          Concurrence{" "}
          <span className="font-medium text-foreground">
            {opportunity.franceCompetition === "none"
              ? "inexistante"
              : opportunity.franceCompetition === "low"
                ? "très faible"
                : "limitée"}
          </span>
          . Le marché existe, la douleur est réelle — personne n&apos;a encore structuré la
          solution.
        </p>
      </div>

      {tractionSignals.slice(3).map((signal) => (
        <div
          key={signal.label}
          className="flex items-center justify-between border-b border-border py-5"
        >
          <div>
            <p className="text-lg font-semibold text-foreground">{signal.label}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Signal de traction</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-foreground/90">{signal.value}</p>
            <TractionSource signal={signal} />
          </div>
        </div>
      ))}
    </AnimatedSection>
  );
}

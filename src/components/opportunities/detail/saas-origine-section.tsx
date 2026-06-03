import { ExternalLink } from "lucide-react";
import type { ForeignMarketProfile, Opportunity } from "@/types/opportunity";
import { getWhyItWorksFact } from "@/types/opportunity";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface SaasOrigineSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

function resolveProfile(opportunity: Opportunity): ForeignMarketProfile {
  if (opportunity.foreignMarketProfile) {
    return opportunity.foreignMarketProfile;
  }

  const inspiration = opportunity.foreignInspiration;
  const productName = inspiration.split("—")[0]?.split("(")[0]?.trim() || inspiration;

  return {
    productName,
    country: opportunity.originCountry,
    flag: opportunity.originFlag,
    tagline: opportunity.pitch,
    problemSolved: getWhyItWorksFact(opportunity.whyItWorks[0] ?? opportunity.pitch),
    targetUsers: opportunity.targetClient,
    businessModel: "Abonnement SaaS B2B, facturation mensuelle.",
    pricing: opportunity.tractionSignals[0]?.value ?? "—",
    keyFeatures: opportunity.mvpPlan.features,
    howItWorks: opportunity.pitch,
    whyItWorksThere: opportunity.whyItWorks.map(getWhyItWorksFact),
    tractionHighlights: opportunity.tractionSignals,
  };
}

export function SaasOrigineSection({ opportunity, animationIndex }: SaasOrigineSectionProps) {
  const profile = resolveProfile(opportunity);
  const franceAdaptation = profile.franceAdaptation ?? opportunity.franceAnalysis;

  return (
    <AnimatedSection
      id="saas-origine"
      animationIndex={animationIndex}
      className="mb-12 scroll-mt-24"
    >
      <SectionTitle number={5} title="Le SaaS aux US" />
      <p className="mb-6 text-sm text-muted-foreground">
        Le modèle qui fonctionne déjà — avant que tu le lances en France
      </p>

      <div className="relative mb-4 overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Inspiré de</p>
            <h3 className="text-2xl font-bold text-foreground">{profile.productName}</h3>
            <p className="mt-1 text-muted-foreground">{profile.tagline}</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {profile.flag} {profile.country}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <a
              href={opportunity.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/20 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              Voir le site <ExternalLink className="h-3 w-3" />
            </a>
            <span className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-center text-xs text-green-400">
              Marché validé ✓
            </span>
          </div>
        </div>

        {profile.tractionHighlights.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {profile.tractionHighlights.map((signal, i) => (
              <a
                key={`${signal.label}-${i}`}
                href={signal.sourceUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl bg-muted/60 p-3 transition-colors hover:bg-muted/50"
              >
                <p className="mb-1 text-xs text-muted-foreground transition-colors group-hover:text-muted-foreground">
                  {signal.label}
                </p>
                <p className="text-lg font-bold text-foreground">{signal.value}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/60">
                  {signal.source}
                  <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Le problème résolu</p>
          <p className="text-sm leading-relaxed text-foreground/80">{profile.problemSolved}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Modèle économique</p>
          <p className="text-sm leading-relaxed text-foreground/80">{profile.businessModel}</p>
          <p className="mt-2 text-sm font-medium text-blue-400">{profile.pricing}</p>
        </div>
      </div>

      {profile.keyFeatures.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Fonctionnalités clés</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {profile.keyFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <span className="shrink-0 text-green-400">✓</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.whyItWorksThere.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Pourquoi ça cartonne là-bas
          </p>
          <div className="space-y-2">
            {profile.whyItWorksThere.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-bold text-blue-400">{i + 1}.</span>
                <p className="text-sm leading-relaxed text-foreground/80">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-green-900/30 bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-widest text-green-500">🇫🇷 Adaptation France</p>
        <div className="mb-4 space-y-2">
          {franceAdaptation.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="mt-0.5 shrink-0 text-green-400">→</span>
              {item}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Réglementation</p>
            <p className="text-sm text-foreground/80">{opportunity.franceFitCriteria.regulation}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Concurrence actuelle</p>
            <p className="text-sm text-foreground/80">{opportunity.franceFitCriteria.competitors}</p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

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
      <p className="mb-6 text-sm text-gray-500">
        Le modèle qui fonctionne déjà — avant que tu le lances en France
      </p>

      <div className="relative mb-4 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">Inspiré de</p>
            <h3 className="text-2xl font-bold text-white">{profile.productName}</h3>
            <p className="mt-1 text-gray-400">{profile.tagline}</p>
            <p className="mt-1 text-sm text-gray-600">
              {profile.flag} {profile.country}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <a
              href={opportunity.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
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
                className="group rounded-xl bg-gray-800/60 p-3 transition-colors hover:bg-gray-800"
              >
                <p className="mb-1 text-xs text-gray-500 transition-colors group-hover:text-gray-400">
                  {signal.label}
                </p>
                <p className="text-lg font-bold text-white">{signal.value}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                  {signal.source}
                  <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">Le problème résolu</p>
          <p className="text-sm leading-relaxed text-gray-300">{profile.problemSolved}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">Modèle économique</p>
          <p className="text-sm leading-relaxed text-gray-300">{profile.businessModel}</p>
          <p className="mt-2 text-sm font-medium text-blue-400">{profile.pricing}</p>
        </div>
      </div>

      {profile.keyFeatures.length > 0 && (
        <div className="mb-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">Fonctionnalités clés</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {profile.keyFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="shrink-0 text-green-400">✓</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.whyItWorksThere.length > 0 && (
        <div className="mb-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">
            Pourquoi ça cartonne là-bas
          </p>
          <div className="space-y-2">
            {profile.whyItWorksThere.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-bold text-blue-400">{i + 1}.</span>
                <p className="text-sm leading-relaxed text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-green-900/30 bg-gray-900 p-5">
        <p className="mb-3 text-xs uppercase tracking-widest text-green-500">🇫🇷 Adaptation France</p>
        <div className="mb-4 space-y-2">
          {franceAdaptation.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="mt-0.5 shrink-0 text-green-400">→</span>
              {item}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-4">
          <div>
            <p className="mb-1 text-xs text-gray-500">Réglementation</p>
            <p className="text-sm text-gray-300">{opportunity.franceFitCriteria.regulation}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-500">Concurrence actuelle</p>
            <p className="text-sm text-gray-300">{opportunity.franceFitCriteria.competitors}</p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

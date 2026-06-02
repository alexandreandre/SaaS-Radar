import type { ReactNode } from "react";
import type { Opportunity } from "@/types/opportunity";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface SaasOrigineSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

function ProfileBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl mb-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">{title}</p>
      {children}
    </div>
  );
}

export function SaasOrigineSection({ opportunity, animationIndex }: SaasOrigineSectionProps) {
  const profile = opportunity.foreignMarketProfile;
  const tractionSignals = profile?.tractionHighlights ?? opportunity.tractionSignals;
  const whyThere = profile?.whyItWorksThere ?? opportunity.whyItWorks;

  const displayName = profile?.productName ?? opportunity.foreignInspiration;
  const displayCountry = profile
    ? `${profile.flag} ${profile.country}`
    : `${opportunity.originFlag} ${opportunity.originCountry}`;

  return (
    <AnimatedSection
      id="saas-origine"
      animationIndex={animationIndex}
      className="mb-12 scroll-mt-24"
    >
      <SectionTitle number={5} title="Le SaaS aux US" />
      <p className="text-sm text-gray-500 mb-6">
        Le modèle qui fonctionne déjà — avant que tu le lances en France
      </p>

      <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Inspiré de</p>
            <h3 className="text-xl font-bold text-white">{displayName}</h3>
            {profile?.tagline && (
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{profile.tagline}</p>
            )}
            <p className="text-sm text-gray-400 mt-1">{displayCountry}</p>
            {profile && (
              <p className="text-xs text-gray-600 mt-2">
                Référence : {opportunity.foreignInspiration}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full">
            Marché validé
          </span>
        </div>

        {tractionSignals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {tractionSignals.map((signal, i) => (
              <div key={`${signal.label}-${i}`} className="p-3 bg-gray-800/50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">{signal.label}</p>
                <p className="text-lg font-bold text-white">{signal.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">via {signal.source}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {profile && (
        <>
          <ProfileBlock title="Le problème qu'il résout">
            <p className="text-gray-300 text-sm leading-relaxed">{profile.problemSolved}</p>
          </ProfileBlock>

          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <ProfileBlock title="Clients cibles">
              <p className="text-gray-300 text-sm leading-relaxed">{profile.targetUsers}</p>
            </ProfileBlock>
            <ProfileBlock title="Modèle économique">
              <p className="text-gray-300 text-sm leading-relaxed">{profile.businessModel}</p>
              <p className="text-sm text-gray-400 mt-3">
                <span className="text-gray-500">Tarification :</span>{" "}
                <span className="text-blue-400">{profile.pricing}</span>
              </p>
            </ProfileBlock>
          </div>

          <ProfileBlock title="Comment ça fonctionne">
            <p className="text-gray-300 text-sm leading-relaxed">{profile.howItWorks}</p>
          </ProfileBlock>

          {profile.keyFeatures.length > 0 && (
            <ProfileBlock title="Fonctionnalités clés">
              <ul className="space-y-3">
                {profile.keyFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="text-green-400 font-bold shrink-0">✓</span>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </ProfileBlock>
          )}
        </>
      )}

      {whyThere.length > 0 && (
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
            Pourquoi ça cartonne là-bas
          </p>
          <div className="space-y-3">
            {whyThere.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-green-400 font-bold mt-0.5 shrink-0">→</span>
                <p className="text-gray-300 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Adaptation France</p>
        <div className="space-y-3">
          {opportunity.franceAnalysis.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-blue-400 font-bold mt-0.5 shrink-0">🇫🇷</span>
              <p className="text-gray-300 text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-800">
          <div>
            <p className="text-xs text-gray-500 mb-1">Réglementation</p>
            <p className="text-sm text-gray-300">{opportunity.franceFitCriteria.regulation}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Concurrence actuelle</p>
            <p className="text-sm text-gray-300">{opportunity.franceFitCriteria.competitors}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Fit culturel</p>
            <p className="text-sm text-gray-300">{opportunity.franceFitCriteria.cultureFit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Le problème existe ?</p>
            <p className="text-sm text-gray-300">
              {opportunity.franceFitCriteria.problemExists ? "✅ Oui" : "❌ Non"}
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

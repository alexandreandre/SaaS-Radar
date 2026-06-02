import type { Opportunity } from "@/types/opportunity";
import { CheckCircle } from "lucide-react";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";
import { OpportunitySimulator } from "@/components/opportunities/detail/opportunity-simulator";
import { SaasOrigineSection } from "@/components/opportunities/detail/saas-origine-section";
import { FinancialSection } from "@/components/opportunities/detail/financial-section";
import { AcquisitionSection } from "@/components/opportunities/detail/acquisition-section";
import { ClaudePromptSection } from "@/components/opportunities/detail/claude-prompt-section";
import { GuideSection } from "@/components/opportunities/detail/guide-section";

export function DetailContent({ opportunity }: { opportunity: Opportunity }) {
  const { tractionSignals } = opportunity;

  return (
    <>
      <AnimatedSection id="opportunite" animationIndex={0} className="mb-12 scroll-mt-24">
        <SectionTitle number={1} title="L'opportunité" />

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <tbody>
              {[
                {
                  label: "Marché d'origine",
                  value: `${opportunity.originFlag} ${opportunity.originCountry}`,
                },
                { label: "Inspiré de", value: opportunity.foreignInspiration },
                { label: "Client cible", value: opportunity.targetClient },
                {
                  label: "Complexité technique",
                  value:
                    opportunity.techComplexity === "low"
                      ? "Faible"
                      : opportunity.techComplexity === "medium"
                        ? "Moyenne"
                        : "Élevée",
                },
                {
                  label: "Lançable en 30 jours",
                  value: opportunity.buildableUnder30Days ? "✅ Oui" : "❌ Non",
                },
                {
                  label: "Entrepreneurs qui le font",
                  value: `${opportunity.entrepreneursBuilding} dans le monde`,
                },
                {
                  label: "Type de client",
                  value: opportunity.clientType === "b2b" ? "B2B" : "B2C",
                },
                {
                  label: "Concurrence en France",
                  value:
                    opportunity.franceCompetition === "none"
                      ? "Aucune"
                      : opportunity.franceCompetition === "low"
                        ? "Faible"
                        : opportunity.franceCompetition === "medium"
                          ? "Moyenne"
                          : "Élevée",
                },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-900/40" : "bg-gray-900/20"}>
                  <td className="w-1/2 px-4 py-3 font-medium text-gray-500">{row.label}</td>
                  <td className="px-4 py-3 text-gray-200">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedSection>

      <AnimatedSection id="chiffres" animationIndex={1} className="mb-12 scroll-mt-24">
        <SectionTitle number={2} title="Ce que gagne déjà le concurrent US 💰" />

        <p className="mb-8 text-base leading-relaxed text-gray-300">
          <span className="font-semibold text-white">{opportunity.foreignInspiration}</span> existe
          depuis 3 ans aux États-Unis. Voici ce qu&apos;ils font chaque mois — et pourquoi personne
          ne le fait encore en France.
        </p>

        <div className="flex items-center justify-between border-b border-gray-800 py-5">
          <div>
            <p className="text-lg font-semibold text-white">Revenu mensuel (MRR)</p>
            <p className="mt-0.5 text-sm text-gray-500">Ce qu&apos;ils encaissent chaque mois</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-green-400">{tractionSignals[0]?.value}</p>
            <p className="mt-1 text-xs text-gray-600">Source : {tractionSignals[0]?.source}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800 py-5">
          <div>
            <p className="text-lg font-semibold text-white">{tractionSignals[1]?.label}</p>
            <p className="mt-0.5 text-sm text-gray-500">Autorité et visibilité en ligne</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-blue-400">{tractionSignals[1]?.value}</p>
            <p className="mt-1 text-xs text-gray-600">Source : {tractionSignals[1]?.source}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800 py-5">
          <div>
            <p className="text-lg font-semibold text-white">{tractionSignals[2]?.label}</p>
            <p className="mt-0.5 text-sm text-gray-500">Communauté et bouche-à-oreille</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-purple-400">{tractionSignals[2]?.value}</p>
            <p className="mt-1 text-xs text-gray-600">Source : {tractionSignals[2]?.source}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-green-800/30 bg-green-950/20 p-5">
          <p className="mb-1 text-sm font-semibold text-green-400">🇫🇷 Et en France ?</p>
          <p className="text-sm leading-relaxed text-gray-300">
            Concurrence{" "}
            <span className="font-medium text-white">
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
            className="flex items-center justify-between border-b border-gray-800 py-5"
          >
            <div>
              <p className="text-lg font-semibold text-white">{signal.label}</p>
              <p className="mt-0.5 text-sm text-gray-500">Signal de traction</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-gray-200">{signal.value}</p>
              <p className="mt-1 text-xs text-gray-600">Source : {signal.source}</p>
            </div>
          </div>
        ))}
      </AnimatedSection>

      <OpportunitySimulator opportunity={opportunity} />

      <AnimatedSection id="pourquoi" animationIndex={3} className="mb-12 scroll-mt-24">
        <SectionTitle number={4} title="Pourquoi ça marche" />
        <p className="mb-4 text-sm text-gray-500">
          Ce business existe déjà — et cartonne à l&apos;étranger
        </p>

        <div className="space-y-3">
          {opportunity.whyItWorks.map((item, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <p className="text-sm text-gray-300">{item}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <SaasOrigineSection opportunity={opportunity} animationIndex={4} />

      <FinancialSection opportunity={opportunity} animationIndex={5} />

      <AcquisitionSection opportunity={opportunity} animationIndex={6} />

      <ClaudePromptSection opportunity={opportunity} animationIndex={7} />

      <GuideSection opportunity={opportunity} animationIndex={8} />
    </>
  );
}

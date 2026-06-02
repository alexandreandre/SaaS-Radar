import type { Opportunity } from "@/types/opportunity";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface AcquisitionSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

export function AcquisitionSection({ opportunity, animationIndex }: AcquisitionSectionProps) {
  const channelCount = opportunity.cacChannels.length;
  const avgCac =
    channelCount > 0
      ? Math.round(
          opportunity.cacChannels.reduce((sum, c) => sum + c.estimate, 0) / channelCount
        )
      : 0;
  const maxCac =
    channelCount > 0 ? Math.max(...opportunity.cacChannels.map((c) => c.estimate)) : 1;
  const realisticPrice =
    opportunity.financialScenarios.find((s) => s.name === "Réaliste")?.avgPrice ?? 79;
  const ltv = realisticPrice * 12;

  return (
    <AnimatedSection
      id="acquisition"
      animationIndex={animationIndex}
      className="mb-12 scroll-mt-24"
    >
      <SectionTitle number={7} title="Trouver tes clients" />
      <p className="text-sm text-gray-500 mb-6">
        Les canaux d&apos;acquisition testés — coûts réels et tactiques concrètes
      </p>

      <div className="flex items-center justify-between p-5 bg-gray-900 border border-gray-800 rounded-xl mb-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">CAC moyen estimé</p>
          <p className="text-3xl font-black text-white">{avgCac}€</p>
          <p className="text-xs text-gray-500 mt-1">coût pour acquérir 1 client</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">LTV estimée (12 mois)</p>
          <p className="text-2xl font-bold text-green-400">{ltv.toLocaleString("fr-FR")}€</p>
          <p className="text-xs text-gray-500 mt-1">revenu par client sur 1 an</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {opportunity.cacChannels.map((channel, i) => {
          const pct = Math.round((channel.estimate / maxCac) * 100);
          const color =
            channel.estimate <= 50
              ? "bg-green-500"
              : channel.estimate <= 120
                ? "bg-blue-500"
                : "bg-yellow-500";

          return (
            <div key={`${channel.channel}-${i}`} className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-semibold">{channel.channel}</p>
                <div className="text-right">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      channel.estimate <= 50
                        ? "text-green-400"
                        : channel.estimate <= 120
                          ? "text-blue-400"
                          : "text-yellow-400"
                    )}
                  >
                    ~{channel.estimate}€ CAC
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full mb-3">
                <div
                  className={cn("h-1.5 rounded-full transition-all", color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">{channel.note}</p>
            </div>
          );
        })}
      </div>

      {opportunity.acquisition.length > 0 && (
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Tactiques détaillées</p>
          <div className="space-y-6">
            {opportunity.acquisition.map((tab, i) => (
              <div key={tab.id ?? i}>
                <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  {tab.title}
                </p>
                <ul className="space-y-2 ml-7">
                  {tab.tactics.map((tactic, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="text-gray-600 mt-1 shrink-0">·</span>
                      {tactic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </AnimatedSection>
  );
}

import type { Opportunity } from "@/types/opportunity";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface FinancialSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

export function FinancialSection({ opportunity, animationIndex }: FinancialSectionProps) {
  const realistic = opportunity.financialScenarios.find((s) => s.name === "Réaliste");

  return (
    <AnimatedSection
      id="financier"
      animationIndex={animationIndex}
      className="mb-12 scroll-mt-24"
    >
      <SectionTitle number={3} title="Potentiel financier" />
      <p className="text-sm text-muted-foreground mb-6">
        Projection MRR réaliste — basée sur les données du marché US adapté à la France
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {opportunity.financialScenarios.map((scenario, i) => (
          <div
            key={`${scenario.name}-${i}`}
            className={cn(
              "p-6 rounded-2xl border transition-all",
              scenario.name === "Réaliste"
                ? "bg-blue-950/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                : "bg-card border-border"
            )}
          >
            {scenario.name === "Réaliste" && (
              <span className="text-xs bg-primary/20 text-blue-400 px-2 py-0.5 rounded-full mb-3 inline-block">
                Le plus probable
              </span>
            )}
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{scenario.name}</p>
            <p
              className={cn(
                "text-3xl font-black mb-1",
                scenario.name === "Prudent"
                  ? "text-yellow-400"
                  : scenario.name === "Réaliste"
                    ? "text-green-400"
                    : "text-blue-400"
              )}
            >
              {scenario.mrr.toLocaleString("fr-FR")}€
            </p>
            <p className="text-xs text-muted-foreground mb-4">/mois</p>
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Clients</span>
                <span className="text-foreground font-medium">{scenario.clients}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prix moyen</span>
                <span className="text-foreground font-medium">{scenario.avgPrice}€/mois</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Marge brute</span>
                <span className="text-green-400 font-medium">{scenario.grossMargin}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenu annuel</span>
                <span className="text-foreground font-medium">
                  {(scenario.mrr * 12).toLocaleString("fr-FR")}€
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 bg-card border border-border rounded-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">MRR réaliste</p>
            <p className="text-xl font-bold text-green-400">
              {realistic?.mrr.toLocaleString("fr-FR")}€
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Revenu annuel</p>
            <p className="text-xl font-bold text-foreground">
              {((realistic?.mrr ?? 0) * 12).toLocaleString("fr-FR")}€
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Potentiel max</p>
            <p className="text-xl font-bold text-blue-400">
              {opportunity.revenueMax.toLocaleString("fr-FR")}€/mois
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Marge brute</p>
            <p className="text-xl font-bold text-foreground">{realistic?.grossMargin}%</p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

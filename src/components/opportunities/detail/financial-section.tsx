import type { Opportunity } from "@/types/opportunity";
import type { TargetScenario } from "@/lib/portfolio";
import { cn, formatCurrency } from "@/lib/utils";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface FinancialSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
  variant?: "detail" | "playbook";
  targetScenario?: TargetScenario;
  /** Affiche un bandeau admin : projections Build Road, pas des revenus sourcés */
  adminReviewDisclaimer?: boolean;
}

function scenarioAccent(name: string, isPlaybook: boolean) {
  if (isPlaybook) {
    if (name === "Prudent") return "text-amber-600";
    if (name === "Réaliste") return "text-emerald-600";
    return "text-primary";
  }
  if (name === "Prudent") return "text-yellow-400";
  if (name === "Réaliste") return "text-green-400";
  return "text-blue-400";
}

export function FinancialSection({
  opportunity,
  animationIndex,
  variant = "detail",
  targetScenario,
  adminReviewDisclaimer = false,
}: FinancialSectionProps) {
  const isPlaybook = variant === "playbook";
  const realistic = opportunity.financialScenarios.find((s) => s.name === "Réaliste");
  const highlightScenario = targetScenario ?? "Réaliste";

  return (
    <AnimatedSection
      id="financier"
      animationIndex={animationIndex}
      className={cn(isPlaybook ? "mb-0" : "mb-12 scroll-mt-24")}
    >
      <SectionTitle
        number={isPlaybook ? 1 : 3}
        title="Potentiel financier"
        subtitle={
          isPlaybook
            ? "Scénarios MRR basés sur le marché US adapté à la France"
            : undefined
        }
        variant={isPlaybook ? "playbook" : "detail"}
      />
      {!isPlaybook ? (
        <div className="mb-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            Projection MRR réaliste — basée sur les données du marché US adapté à la France
          </p>
          {adminReviewDisclaimer ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-900">
              Relecture admin : ces scénarios sont des projections Build Road pour un solo dev en
              France (12–18 mois), pas les revenus réels du SaaS source.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {opportunity.financialScenarios.map((scenario, i) => {
          const isTarget = scenario.name === highlightScenario;
          const isRealisticDefault = !targetScenario && scenario.name === "Réaliste";

          return (
            <div
              key={`${scenario.name}-${i}`}
              className={cn(
                "rounded-2xl border p-6 transition-all",
                isPlaybook
                  ? isTarget
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                  : scenario.name === "Réaliste"
                    ? "border-blue-500/40 bg-blue-950/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                    : "border-border bg-card",
              )}
            >
              {isTarget ? (
                <span
                  className={cn(
                    "mb-3 inline-block rounded-full px-2 py-0.5 text-xs",
                    isPlaybook
                      ? "bg-primary/15 text-primary"
                      : "bg-primary/20 text-blue-400",
                  )}
                >
                  {targetScenario ? "Votre objectif cockpit" : "Le plus probable"}
                </span>
              ) : isRealisticDefault && !isPlaybook ? (
                <span className="mb-3 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs text-blue-400">
                  Le plus probable
                </span>
              ) : null}
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                {scenario.name}
              </p>
              <p className={cn("mb-1 text-3xl font-black", scenarioAccent(scenario.name, isPlaybook))}>
                {scenario.mrr.toLocaleString("fr-FR")}€
              </p>
              <p className="mb-4 text-xs text-muted-foreground">/mois</p>
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Clients</span>
                  <span className="font-medium text-foreground">{scenario.clients}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prix moyen</span>
                  <span className="font-medium text-foreground">{scenario.avgPrice}€/mois</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Marge brute</span>
                  <span
                    className={cn(
                      "font-medium",
                      isPlaybook ? "text-emerald-600" : "text-green-400",
                    )}
                  >
                    {scenario.grossMargin}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenu annuel</span>
                  <span className="font-medium text-foreground">
                    {(scenario.mrr * 12).toLocaleString("fr-FR")}€
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isPlaybook ? (
        <p className="text-xs text-muted-foreground">
          Potentiel max fiche :{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(opportunity.revenueMax)}/mois
          </span>
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">MRR réaliste</p>
              <p className="text-xl font-bold text-green-400">
                {realistic?.mrr.toLocaleString("fr-FR")}€
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Revenu annuel</p>
              <p className="text-xl font-bold text-foreground">
                {((realistic?.mrr ?? 0) * 12).toLocaleString("fr-FR")}€
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Potentiel max</p>
              <p className="text-xl font-bold text-blue-400">
                {opportunity.revenueMax.toLocaleString("fr-FR")}€/mois
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Marge brute</p>
              <p className="text-xl font-bold text-foreground">{realistic?.grossMargin}%</p>
            </div>
          </div>
        </div>
      )}
    </AnimatedSection>
  );
}

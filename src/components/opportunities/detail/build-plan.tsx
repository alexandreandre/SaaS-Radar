import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { totalInfraMonthly } from "@/data/opportunity-enrichment";
import { formatCurrency } from "@/lib/utils";

export function BuildPlan({ opportunity }: { opportunity: Opportunity }) {
  const costs = opportunity.infraCosts ?? [];
  const monthly = totalInfraMonthly(costs);
  const weeks = opportunity.launchTimeline ?? [];

  const content = (
    <div className="space-y-10">
      <div>
        <h3 className="text-lg font-semibold">À faire en version 1</h3>
        <ul className="mt-4 space-y-3 text-base">
          {opportunity.mvpPlan.features.map((f) => (
            <li key={f} className="flex gap-3">
              <span className="text-primary">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold">À reporter (ne pas faire tout de suite)</h3>
        <ul className="mt-4 space-y-2 text-base text-muted-foreground">
          {opportunity.mvpPlan.notYet.map((f) => (
            <li key={f}>— {f}</li>
          ))}
        </ul>
      </div>
      <p className="text-base">
        <span className="font-medium">Outils conseillés :</span>{" "}
        {opportunity.mvpPlan.stack.join(", ")}
      </p>
      <p className="text-base text-muted-foreground">
        Budget technique estimé : <strong className="text-foreground">{formatCurrency(monthly)}/mois</strong>
      </p>
      <div>
        <h3 className="text-lg font-semibold">Semaine par semaine</h3>
        <ol className="mt-6 space-y-4">
          {weeks.map((w) => (
            <li key={w.week} className="rounded-lg border border-border p-5">
              <p className="font-semibold">
                Semaine {w.week} — {w.goal}
              </p>
              <ul className="mt-3 space-y-2 text-base text-muted-foreground">
                {w.actions.map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium text-primary">Objectif : {w.kpi}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  return (
    <SectionShell
      id="plan"
      step={4}
      title="Votre plan sur 14 jours"
      subtitle="Quoi construire, quoi éviter, et quoi faire chaque semaine"
      requiredTier="builder"
      variant="premium"
    >
      <PaywallGate
        requiredTier="builder"
        preview={
          <p>
            {opportunity.mvpPlan.features.length} fonctionnalités · plan sur 4 semaines · ~{formatCurrency(monthly)}
            /mois de coûts techniques
          </p>
        }
        message="Recevez le plan jour par jour pour lancer sans vous perdre"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}

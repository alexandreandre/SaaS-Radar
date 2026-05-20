"use client";

import { useState } from "react";
import Link from "next/link";
import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function ScenarioTable({ fin }: { fin: Opportunity["financialScenarios"][0] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="pb-3 font-medium">Clients</th>
          <th className="pb-3 font-medium">Prix moy.</th>
          <th className="pb-3 font-medium">MRR</th>
          <th className="pb-3 font-medium">Marge brute</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="py-3 font-semibold">{fin.clients}</td>
          <td className="py-3">{formatCurrency(fin.avgPrice)}</td>
          <td className="py-3 font-semibold text-primary">{formatCurrency(fin.mrr)}</td>
          <td className="py-3">{fin.grossMargin}%</td>
        </tr>
      </tbody>
    </table>
  );
}

export function FinancialProjections({ opportunity }: { opportunity: Opportunity }) {
  const { tier } = useTier();
  const realisticIdx = opportunity.financialScenarios.findIndex((s) => s.name === "Réaliste");
  const [scenario, setScenario] = useState(realisticIdx >= 0 ? realisticIdx : 1);
  const fin = opportunity.financialScenarios[scenario];
  const builderAccess = hasTier(tier, "builder");
  const proAccess = hasTier(tier, "pro");

  const avgCac =
    opportunity.cacChannels.reduce((s, c) => s + c.estimate, 0) / opportunity.cacChannels.length;
  const ltv = fin.avgPrice * 24;
  const ltvCac = (ltv / avgCac).toFixed(1);

  return (
    <SectionShell
      id="financials"
      title="Projections financières"
      subtitle="Estimations — pas des garanties"
      requiredTier="free"
    >
      {builderAccess ? (
        <>
          <div className="flex flex-wrap gap-2">
            {opportunity.financialScenarios.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setScenario(i)}
                className={`rounded-sm px-4 py-2 font-data text-[10px] font-medium uppercase tracking-data transition-colors ${
                  scenario === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <ScenarioTable fin={fin} />
          </div>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/simulator">Ouvrir le simulateur complet →</Link>
          </Button>
        </>
      ) : (
        <>
          <p className="label-data">Scénario réaliste (aperçu)</p>
          <div className="mt-4">
            <ScenarioTable fin={opportunity.financialScenarios[realisticIdx >= 0 ? realisticIdx : 0]} />
          </div>
          <PaywallGate
            requiredTier="builder"
            className="mt-6"
            preview={<p className="text-sm text-muted-foreground">Scénarios Prudent et Optimiste + lien simulateur</p>}
            message="Comparez les 3 scénarios et projetez votre MRR"
          >
            <div className="flex gap-2">
              {opportunity.financialScenarios.map((s) => (
                <span key={s.name} className="rounded-sm bg-muted px-3 py-1 text-sm">
                  {s.name}
                </span>
              ))}
            </div>
          </PaywallGate>
        </>
      )}

      {proAccess ? (
        <div className="mt-6 grid gap-4 rounded-lg border border-primary/20 bg-accent/30 p-4 sm:grid-cols-3">
          <div>
            <p className="label-data">LTV estimée (24 mois)</p>
            <p className="mt-1 font-display text-lg font-medium tabular-nums">{formatCurrency(ltv)}</p>
          </div>
          <div>
            <p className="label-data">CAC moyen</p>
            <p className="mt-1 font-display text-lg font-medium tabular-nums">≈ {formatCurrency(avgCac)}</p>
          </div>
          <div>
            <p className="label-data">Ratio LTV / CAC</p>
            <p className="mt-1 font-display text-lg font-medium tabular-nums text-primary">{ltvCac}x</p>
          </div>
        </div>
      ) : (
        <PaywallGate
          requiredTier="pro"
          className="mt-6"
          preview={<p className="text-sm text-muted-foreground">LTV, CAC moyen et ratio LTV/CAC calculés</p>}
          message="Métriques unit economics — réservé Pro"
        >
          <p>LTV / CAC</p>
        </PaywallGate>
      )}
    </SectionShell>
  );
}

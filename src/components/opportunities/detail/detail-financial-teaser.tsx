"use client";

import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function DetailFinancialTeaser({ opportunity }: { opportunity: Opportunity }) {
  const realistic =
    opportunity.financialScenarios.find((s) => s.name === "Réaliste") ??
    opportunity.financialScenarios[1] ??
    opportunity.financialScenarios[0];

  const scenarios = [
    ...opportunity.financialScenarios.filter((s) => s.name === "Réaliste"),
    ...opportunity.financialScenarios.filter((s) => s.name !== "Réaliste"),
  ];

  return (
    <SectionShell
      id="financials"
      title="Potentiel financier"
      subtitle="Projection MRR sur 12 mois — scénario réaliste"
      className="mb-6"
    >
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3">
        {scenarios.map((s) => {
          const isRealistic = s.name === "Réaliste";
          return (
            <div
              key={s.name}
              className={cn(
                "flex h-full flex-col justify-between rounded-xl border p-4 text-center",
                isRealistic
                  ? "order-first border-blue-500 bg-blue-950/20 sm:order-none"
                  : "border-border bg-muted/40 blur-sm opacity-50 select-none pointer-events-none"
              )}
            >
              <div>
                <p className="font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                  {s.name}
                </p>
                {isRealistic ? (
                  <p className="mt-2 font-display text-2xl font-medium tabular-nums text-primary sm:text-3xl">
                    {formatCurrency(realistic.mrr)}
                    <span className="text-base text-muted-foreground"> /mois</span>
                  </p>
                ) : (
                  <p className="mt-2 font-display text-xl font-medium tabular-nums text-foreground/40">
                    {formatCurrency(s.mrr)}
                  </p>
                )}
              </div>
              {isRealistic ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  avec {realistic.clients} clients à {formatCurrency(realistic.avgPrice)}/mois en moyenne
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground/50">
                  {s.clients} × {formatCurrency(s.avgPrice)}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Scénarios Prudent et Optimiste disponibles avec l&apos;abonnement Builder
      </p>
    </SectionShell>
  );
}

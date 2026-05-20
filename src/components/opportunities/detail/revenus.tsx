import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { formatCurrency } from "@/lib/utils";

export function Revenus({ opportunity }: { opportunity: Opportunity }) {
  const realistic =
    opportunity.financialScenarios.find((s) => s.name === "Réaliste") ?? opportunity.financialScenarios[1];

  return (
    <SectionShell
      id="revenus"
      step={3}
      title="Combien vous pouvez gagner"
      subtitle="Estimation réaliste — pas une promesse"
    >
      <div className="rounded-xl border-2 border-primary/20 bg-accent/20 p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">Scénario réaliste</p>
        <p className="mt-2 font-display text-4xl font-medium tabular-nums text-primary sm:text-5xl">
          {formatCurrency(realistic.mrr)}
          <span className="text-2xl text-muted-foreground"> /mois</span>
        </p>
        <p className="mt-4 text-lg text-muted-foreground">
          avec {realistic.clients} clients à {formatCurrency(realistic.avgPrice)}/mois en moyenne
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {opportunity.financialScenarios.map((s) => (
          <div key={s.name} className="rounded-lg border border-border p-5 text-center">
            <p className="font-medium">{s.name}</p>
            <p className="mt-2 font-display text-2xl tabular-nums text-primary">{formatCurrency(s.mrr)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {s.clients} clients · marge {s.grossMargin}%
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

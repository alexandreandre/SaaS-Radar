import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";

export function MarketFrance({ opportunity }: { opportunity: Opportunity }) {
  const tam = opportunity.tamBreakdown;

  return (
    <SectionShell
      id="market"
      step={2}
      title="Le marché en France"
      subtitle="Le problème existe-t-il vraiment ici ?"
    >
      <ul className="space-y-4 text-lg leading-relaxed">
        {opportunity.franceAnalysis.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-primary">→</span>
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-4 rounded-lg border border-border bg-muted/30 p-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Réglementation</p>
          <p className="mt-2 text-base">{opportunity.franceFitCriteria.regulation}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Concurrence actuelle</p>
          <p className="mt-2 text-base">{opportunity.franceFitCriteria.competitors}</p>
        </div>
      </div>

      {tam && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Marché total</p>
            <p className="mt-2 text-base font-medium">{tam.tam}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Cible réaliste</p>
            <p className="mt-2 text-base font-medium">{tam.sam}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Objectif 12 mois</p>
            <p className="mt-2 text-base font-medium text-primary">{tam.som}</p>
          </div>
          {tam.note && (
            <p className="sm:col-span-3 text-sm text-muted-foreground">{tam.note}</p>
          )}
        </div>
      )}
    </SectionShell>
  );
}

import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { StackInline } from "@/components/cockpit/build/build-tool-logo";
import { totalInfraMonthly } from "@/data/opportunity-enrichment";

export function MvpPlan({ opportunity }: { opportunity: Opportunity }) {
  const costs = opportunity.infraCosts ?? [];
  const monthly = totalInfraMonthly(costs);

  const content = (
    <>
      <h3 className="text-sm font-medium">À construire (V1)</h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-foreground/90">
        {opportunity.mvpPlan.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <h3 className="mt-6 text-sm font-medium">À ne PAS construire encore</h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {opportunity.mvpPlan.notYet.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <h3 className="mt-6 text-sm font-medium">Stack recommandée</h3>
      <p className="mt-2 font-data text-sm text-muted-foreground">
        <StackInline items={opportunity.mvpPlan.stack} />
      </p>
      <h3 className="mt-6 text-sm font-medium">Roadmap 14 jours</h3>
      <div className="mt-3 space-y-2">
        {opportunity.mvpPlan.roadmap.map((r) => (
          <div key={r.day} className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <span className="font-data text-[10px] font-medium uppercase tracking-data text-primary">{r.day}</span>
            <span className="text-muted-foreground"> — {r.tasks.join(", ")}</span>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <SectionShell
      id="mvp"
      title="Plan MVP — 14 jours"
      subtitle="Feuille de route pour shipper vite"
      requiredTier="builder"
    >
      <PaywallGate
        requiredTier="builder"
        preview={
          <p className="text-sm">
            {opportunity.mvpPlan.features.length} features V1 · stack {opportunity.mvpPlan.stack[0]} · coût infra ~{monthly}€/mois
          </p>
        }
        message="Roadmap jour par jour, scope V1 et anti-patterns"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}

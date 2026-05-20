import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { formatCurrency } from "@/lib/utils";
import { totalInfraMonthly } from "@/data/opportunity-enrichment";

export function InfraCosts({ opportunity }: { opportunity: Opportunity }) {
  const costs = opportunity.infraCosts ?? [];
  const total = totalInfraMonthly(costs);

  const content = (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="pb-2 font-medium">Poste</th>
          <th className="pb-2 font-medium">Coût/mois</th>
          <th className="pb-2 font-medium">Note</th>
          <th className="pb-2 font-medium">Alternative</th>
        </tr>
      </thead>
      <tbody>
        {costs.map((c) => (
          <tr key={c.item} className="border-b border-border last:border-0">
            <td className="py-3 font-medium">{c.item}</td>
            <td className="py-3 font-data tabular-nums">{formatCurrency(c.estimate)}</td>
            <td className="py-3 text-muted-foreground">{c.note}</td>
            <td className="py-3 text-xs text-muted-foreground">{c.alternative ?? "—"}</td>
          </tr>
        ))}
        <tr className="bg-accent/30">
          <td className="py-3 font-semibold">Total estimé</td>
          <td className="py-3 font-display text-lg font-medium tabular-nums text-primary">
            {formatCurrency(total)}/mois
          </td>
          <td colSpan={2} />
        </tr>
      </tbody>
    </table>
  );

  return (
    <SectionShell
      id="infra"
      title="Stack & coûts infra"
      subtitle="Budget réaliste pour lancer en France"
      requiredTier="builder"
    >
      <PaywallGate
        requiredTier="builder"
        preview={
          <p className="font-display text-lg font-medium tabular-nums">
            ~{formatCurrency(total)}/mois <span className="text-sm font-sans font-normal text-muted-foreground">({costs.length} postes détaillés)</span>
          </p>
        }
        message="Breakdown ligne par ligne + alternatives moins chères"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}

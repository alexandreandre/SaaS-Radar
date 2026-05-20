import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";

export function FrenchCompetitors({ opportunity }: { opportunity: Opportunity }) {
  const competitors = opportunity.frenchCompetitors ?? [];

  const content = (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 font-medium">Acteur</th>
              <th className="pb-2 font-medium">Positionnement</th>
              <th className="pb-2 font-medium">Pricing</th>
              <th className="pb-2 font-medium">Force</th>
              <th className="pb-2 font-medium">Faille</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c) => (
              <tr key={c.name} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{c.name}</td>
                <td className="py-3 text-muted-foreground">{c.positioning}</td>
                <td className="py-3 font-data tabular-nums">{c.pricing}</td>
                <td className="py-3">{c.strength}</td>
                <td className="py-3 text-primary">{c.weakness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 rounded-lg border border-dashed border-primary/30 bg-accent/20 p-4">
        <p className="label-data">Votre angle</p>
        <p className="mt-2 text-sm leading-relaxed">
          Cibler le gap entre solutions généralistes et acteurs legacy — vertical, mobile-first, prix PME.
        </p>
      </div>
    </>
  );

  return (
    <SectionShell
      id="competitors"
      title="Concurrents France"
      subtitle="Cartographie du paysage local"
      requiredTier="builder"
    >
      <PaywallGate
        requiredTier="builder"
        preview={
          <p className="text-sm text-muted-foreground">
            {competitors.length} concurrents identifiés — positionnement, pricing et failles
          </p>
        }
        message="Tableau détaillé pour trouver votre angle de différenciation"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}

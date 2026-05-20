"use client";

import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { Badge } from "@/components/ui/badge";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";

function SignalCard({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-medium tabular-nums">{value}</p>
      <Badge variant="outline" className="mt-2">
        {source}
      </Badge>
    </div>
  );
}

export function TractionSignals({ opportunity }: { opportunity: Opportunity }) {
  const { tier } = useTier();
  const fullAccess = hasTier(tier, "builder");
  const visible = opportunity.tractionSignals.slice(0, 2);
  const locked = opportunity.tractionSignals.slice(2);

  return (
    <SectionShell
      id="traction"
      title="Signaux de traction"
      subtitle="Données sourcées — pas inventées"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((s) => (
          <SignalCard key={s.label} {...s} />
        ))}
        {fullAccess ? (
          locked.map((s) => <SignalCard key={s.label} {...s} />)
        ) : (
          locked.length > 0 && (
            <div className="sm:col-span-2">
              <PaywallGate
                requiredTier="builder"
                preview={
                  <p className="text-xs text-muted-foreground">
                    +{locked.length} signaux supplémentaires (MRR, backlinks, avis…)
                  </p>
                }
                message="Accédez aux 4 signaux de traction sourcés"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {locked.map((s) => (
                    <SignalCard key={s.label} {...s} />
                  ))}
                </div>
              </PaywallGate>
            </div>
          )
        )}
      </div>
    </SectionShell>
  );
}

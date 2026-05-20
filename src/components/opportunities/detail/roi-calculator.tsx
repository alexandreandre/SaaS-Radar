"use client";

import { useMemo, useState } from "react";
import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function RoiCalculator({ opportunity }: { opportunity: Opportunity }) {
  const inputs = opportunity.roiInputs ?? [];
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(inputs.map((i) => [i.id, i.defaultValue]))
  );

  const pitch = useMemo(() => {
    const clients = values.clients ?? 50;
    const price = values.price ?? 79;
    const hours = values.hours ?? 4;
    const hourly = values.hourly ?? 45;
    const mrr = clients * price;
    const valuePerClient = hours * hourly;
    return `Pour ${clients} clients à ${formatCurrency(price)}/mois, vous générez ${formatCurrency(mrr)} MRR. Chaque client économise ~${hours}h/mois (≈ ${formatCurrency(valuePerClient)} de valeur) — ROI évident dès le premier mois.`;
  }, [values]);

  const content = (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {inputs.map((input) => (
          <div key={input.id}>
            <Label htmlFor={input.id} className="text-xs">
              {input.label}
            </Label>
            <input
              id={input.id}
              type="range"
              min={input.min}
              max={input.max}
              value={values[input.id] ?? input.defaultValue}
              onChange={(e) => setValues((v) => ({ ...v, [input.id]: Number(e.target.value) }))}
              className="mt-2 w-full accent-primary"
            />
            <p className="mt-1 font-data text-sm tabular-nums">
              {values[input.id] ?? input.defaultValue}
              {input.unit}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-primary/20 bg-accent/30 p-4">
        <p className="label-data">Pitch deck — ligne à copier</p>
        <p className="mt-2 font-display text-base italic leading-relaxed">{pitch}</p>
      </div>
    </div>
  );

  return (
    <SectionShell
      id="roi"
      title="Calculateur ROI client"
      subtitle="Argumentaire chiffré pour convaincre vos premiers clients"
      requiredTier="builder"
    >
      <PaywallGate
        requiredTier="builder"
        preview={
          <p className="text-sm text-muted-foreground">
            Ajustez clients, prix et heures économisées — phrase de vente générée automatiquement
          </p>
        }
        message="Simulateur interactif + snippet pitch prêt à l'emploi"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}

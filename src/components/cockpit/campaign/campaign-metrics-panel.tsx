"use client";

import type { Opportunity } from "@/types/opportunity";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getCacNoteForChannel } from "@/lib/campaign/recommend";
import type { MetricsSnapshot } from "@/lib/connectors/types";

type CampaignMetricsPanelProps = {
  opportunity: Opportunity;
  channel: ExtendedChannelKey;
  latest?: MetricsSnapshot | null;
  smartGoalTarget?: number;
  smartGoalCurrent?: number;
};

export function CampaignMetricsPanel({
  opportunity,
  channel,
  latest,
  smartGoalTarget,
  smartGoalCurrent,
}: CampaignMetricsPanelProps) {
  const cacNote = getCacNoteForChannel(opportunity, channel);
  const avgPrice =
    opportunity.financialScenarios.find((s) => s.name === "Réaliste")?.avgPrice ?? 79;
  const signups = latest?.signups ?? 0;
  const spend = latest?.adSpend ?? 0;
  const estimatedCac = signups > 0 && spend > 0 ? Math.round(spend / signups) : null;
  const projectedCac = cacNote?.estimate ?? null;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">Mesure live</p>
      <h3 className="mt-1 text-lg font-semibold">Projection vs réel</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Signups (période)" value={String(signups)} />
        <MetricTile label="Dépenses pub" value={spend > 0 ? `${Math.round(spend)} €` : "—"} />
        <MetricTile
          label="CAC estimé"
          value={estimatedCac != null ? `${estimatedCac} €` : "—"}
          hint={projectedCac != null ? `Projection fiche : ~${projectedCac} €` : undefined}
        />
        <MetricTile label="Prix moyen (fiche)" value={`${avgPrice} €`} />
      </div>

      {smartGoalTarget != null && smartGoalCurrent != null ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Objectif campagne : {smartGoalCurrent}/{smartGoalTarget}
        </p>
      ) : null}

      {estimatedCac != null && projectedCac != null && estimatedCac > projectedCac * 1.5 ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          CAC réel au-dessus de la projection — envisagez de régénérer vos créas ou pivoter de canal.
        </p>
      ) : null}
    </section>
  );
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

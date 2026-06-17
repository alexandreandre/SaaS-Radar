"use client";

import { ArrowRight, Wallet } from "lucide-react";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { UserProject } from "@/lib/portfolio";
import { formatCurrency } from "@/lib/utils";

type PlaybookFinancesContextProps = {
  project: UserProject;
  data: CockpitData;
  onModuleChange?: (module: CockpitModuleId) => void;
};

export function PlaybookFinancesContextBanner({
  onModuleChange,
}: Pick<PlaybookFinancesContextProps, "onModuleChange">) {
  if (!onModuleChange) return null;

  return (
    <button
      type="button"
      onClick={() => onModuleChange("revenus")}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 text-left transition-colors hover:bg-primary/10"
    >
      <span className="text-base font-semibold text-foreground">Voir mon MRR réel</span>
      <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
    </button>
  );
}

export function PlaybookFinanceBridge({
  project,
  data,
  onModuleChange,
}: PlaybookFinancesContextProps) {
  const cashOnHand = project.cashOnHand ?? 5000;
  const qontoStream = project.connectorStreams?.qonto;
  const treasury =
    qontoStream?.type === "finance" ? qontoStream.cashBalance : cashOnHand;
  const runway = data.metrics.runwayMonths;

  if (!onModuleChange) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" />
          Trésorerie
        </span>
        <span className="font-data font-medium tabular-nums">{formatCurrency(treasury)}</span>
        <span className="text-muted-foreground">·</span>
        <span>
          <span className="text-muted-foreground">Runway </span>
          <span className="font-medium">
            {runway !== null ? `${runway} mois` : "—"}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => onModuleChange("finance")}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
      >
        Module Finance
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

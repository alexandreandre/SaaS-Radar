"use client";

import { Plug } from "lucide-react";
import { getConnector } from "@/lib/connectors/registry";
import type { StackHealth } from "@/lib/stack-health";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StackHealthBarProps = {
  stackHealth: StackHealth;
  onModuleChange?: (module: CockpitModuleId) => void;
  onConnect?: (connectorId: StackHealth["nextRecommended"]) => void;
  compact?: boolean;
};

export function StackHealthBar({
  stackHealth,
  onModuleChange,
  compact = false,
}: StackHealthBarProps) {
  const { recommended, connected, missing, coveragePct, nextRecommended } = stackHealth;

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card shadow-card",
        compact ? "p-4" : "p-6"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-primary">
            Stack health
          </p>
          <h3 className="mt-1 font-semibold">
            {connected.length}/{recommended.length} connecteurs recommandés
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Couverture {coveragePct} % de votre stack Radar
          </p>
        </div>
        {nextRecommended && onModuleChange ? (
          <Button size="sm" variant="outline" onClick={() => onModuleChange("integrations")}>
            <Plug className="h-4 w-4" />
            Connecter {getConnector(nextRecommended)?.name ?? nextRecommended}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {recommended.map((id) => {
          const isConnected = connected.includes(id);
          const name = getConnector(id)?.name ?? id;
          return (
            <span
              key={id}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs",
                isConnected
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800"
                  : "border-border bg-muted/50 text-muted-foreground"
              )}
            >
              {name} {isConnected ? "✓" : "○"}
            </span>
          );
        })}
      </div>

      {missing.length > 0 && !compact ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Manquants : {missing.map((id) => getConnector(id)?.name ?? id).join(", ")}
        </p>
      ) : null}
    </section>
  );
}

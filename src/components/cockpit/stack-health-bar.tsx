"use client";

import { getConnector } from "@/lib/connectors/registry";
import type { ConnectorId } from "@/lib/connectors/types";
import type { StackHealth } from "@/lib/stack-health";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { ConnectorLogo } from "@/components/cockpit/integrations/connector-logo";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
            Couverture {coveragePct} % de votre stack
          </p>
        </div>
        {nextRecommended && onModuleChange ? (
          <Button size="sm" variant="outline" onClick={() => onModuleChange("integrations")}>
            <ConnectorLogo connectorId={nextRecommended} size="sm" showTile={false} />
            Connecter {getConnector(nextRecommended)?.name ?? nextRecommended}
          </Button>
        ) : null}
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="mt-4 flex flex-wrap gap-2">
          {recommended.map((id) => {
            const isConnected = connected.includes(id);
            const name = getConnector(id)?.name ?? id;
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-1",
                      isConnected
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-border bg-muted/50 opacity-70"
                    )}
                  >
                    <ConnectorLogo
                      connectorId={id as ConnectorId}
                      size="sm"
                      showTile={false}
                      showRing={isConnected}
                    />
                    <span
                      className={cn(
                        "text-xs",
                        isConnected ? "text-emerald-800" : "text-muted-foreground"
                      )}
                    >
                      {isConnected ? "✓" : "○"}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {name} — {isConnected ? "connecté" : "manquant"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {missing.length > 0 && !compact ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Manquants : {missing.map((id) => getConnector(id)?.name ?? id).join(", ")}
        </p>
      ) : null}
    </section>
  );
}

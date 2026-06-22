"use client";

import type { CampaignActionItem } from "@/lib/campaign/kits";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { getCampaignTool } from "@/lib/campaign/tools";
import { getConnector } from "@/lib/connectors/registry";
import { actionProgress } from "@/lib/campaign/actions";

type CampaignActionBoardProps = {
  actions: CampaignActionItem[];
  defaultOpen?: boolean;
  compact?: boolean;
  onToggle: (actionId: string) => void;
  onOpenTool?: (toolId: string, url?: string) => void;
};

const PHASE_LABELS: Record<CampaignActionItem["phase"], string> = {
  prepare: "Préparation",
  execute: "Cette semaine",
  measure: "Mesure",
};

export function CampaignActionBoard({
  actions,
  defaultOpen = true,
  compact = false,
  onToggle,
  onOpenTool,
}: CampaignActionBoardProps) {
  const progress = actionProgress(actions);
  const executePct =
    progress.execute.total > 0
      ? Math.round((progress.execute.done / progress.execute.total) * 100)
      : 0;

  const phases: CampaignActionItem["phase"][] = ["prepare", "execute", "measure"];

  const body = (
    <div className={compact ? "space-y-6" : "space-y-6 border-t border-border px-5 pb-5 pt-4"}>
      {phases.map((phase) => {
          const items = actions.filter((a) => a.phase === phase);
          if (items.length === 0) return null;
          return (
            <div key={phase}>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {PHASE_LABELS[phase]}
              </p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={() => onToggle(item.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={item.done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"}>
                        {item.label}
                      </p>
                      {item.detail ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                      ) : null}
                      {item.copyPayload ? (
                        <div className="mt-2 flex items-center gap-2">
                          <CopyButton text={item.copyPayload} />
                        </div>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.toolId ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onOpenTool?.(
                                item.toolId!,
                                getCampaignTool(item.toolId!)?.deepLink,
                              )
                            }
                          >
                            Ouvrir {getCampaignTool(item.toolId!)?.name ?? item.toolId}
                          </Button>
                        ) : null}
                        {item.connectorId ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenTool?.(item.connectorId!, undefined)}
                          >
                            Connecter {getConnector(item.connectorId!)?.name ?? item.connectorId}
                          </Button>
                        ) : null}
                        {item.externalUrl ? (
                          <Button type="button" size="sm" variant="ghost" asChild>
                            <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                              Ouvrir
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <h3 className="text-sm font-semibold">Actions cette semaine</h3>
          <span className="text-sm text-muted-foreground">
            {progress.execute.done}/{progress.execute.total} · {executePct}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${executePct}%` }}
          />
        </div>
        {body}
      </div>
    );
  }

  return (
    <details className="group rounded-xl border border-border bg-card shadow-card" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-data text-[10px] uppercase tracking-data text-primary">Étape 4</p>
            <h3 className="text-lg font-semibold">Plan d&apos;action</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {progress.execute.done}/{progress.execute.total} actions · {executePct}%
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${executePct}%` }}
          />
        </div>
      </summary>
      {body}
    </details>
  );
}

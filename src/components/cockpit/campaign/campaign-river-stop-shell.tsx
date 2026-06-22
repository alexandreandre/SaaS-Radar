"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CampaignRiverStopShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
  onBack?: () => void;
  onAdjust?: () => void;
  adjusting?: boolean;
  actionHint?: string;
  className?: string;
};

export function CampaignRiverStopShell({
  title,
  subtitle,
  children,
  onConfirm,
  confirmLabel = "C'est bon",
  onBack,
  onAdjust,
  adjusting,
  actionHint,
  className,
}: CampaignRiverStopShellProps) {
  return (
    <section
      className={cn(
        "animate-in fade-in slide-in-from-right-4 rounded-xl border border-border bg-card p-6 shadow-card duration-300",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {onBack ? (
          <Button type="button" variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
        ) : null}
      </div>

      <div className="mt-5">{children}</div>

      {actionHint ? (
        <p className="mt-5 text-xs text-muted-foreground">{actionHint}</p>
      ) : null}

      <div className={cn("flex flex-wrap items-center gap-3", actionHint ? "mt-3" : "mt-6")}>
        <Button type="button" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        {onAdjust ? (
          <Button type="button" variant="ghost" size="sm" onClick={onAdjust}>
            {adjusting ? "Masquer" : "Ajuster"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ModuleCalloutProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon?: LucideIcon;
  variant?: "default" | "warning" | "critical";
};

const VARIANTS = {
  default: "border-dashed border-border bg-muted/20",
  warning: "border-amber-500/40 bg-amber-500/10",
  critical: "border-red-500/40 bg-red-500/10",
};

export function ModuleCallout({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Info,
  variant = "default",
}: ModuleCalloutProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        VARIANTS[variant],
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-0.5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onAction}>
        {actionLabel}
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

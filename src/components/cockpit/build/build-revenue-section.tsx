"use client";

import type { UserProject } from "@/lib/portfolio";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

type BuildRevenueSectionProps = {
  project: UserProject;
  onToggle: (id: string) => void;
  onModuleChange?: (module: CockpitModuleId) => void;
};

export function BuildRevenueSection({
  project,
  onToggle,
  onModuleChange,
}: BuildRevenueSectionProps) {
  const revenueMilestones = project.milestones.filter((m) => m.source === "revenue");
  if (revenueMilestones.length === 0) return null;

  return (
    <details className="rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Après le MVP — jalons revenus</span>
      </summary>
      <div className="space-y-3 border-t border-border px-5 pb-5 pt-4">
        <p className="text-sm text-muted-foreground">
          Ces jalons concernent la commercialisation, une fois le produit construit.
        </p>
        {revenueMilestones.map((milestone) => (
          <label
            key={milestone.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
          >
            <Checkbox
              checked={milestone.done}
              onCheckedChange={() => onToggle(milestone.id)}
            />
            <span className={milestone.done ? "text-muted-foreground line-through" : ""}>
              {milestone.label}
            </span>
          </label>
        ))}
        {onModuleChange ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onModuleChange("revenus")}
          >
            Ouvrir le module Revenus
          </Button>
        ) : null}
      </div>
    </details>
  );
}

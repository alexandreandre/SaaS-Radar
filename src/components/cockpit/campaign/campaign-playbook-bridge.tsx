"use client";

import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CockpitModuleId } from "@/lib/cockpit-modules";

type CampaignPlaybookBridgeProps = {
  onModuleChange: (module: CockpitModuleId) => void;
};

export function CampaignPlaybookBridge({ onModuleChange }: CampaignPlaybookBridgeProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Le <strong className="font-medium text-foreground">pourquoi</strong> (CAC, tactiques,
        concurrence) est dans votre fiche Modèle.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={() => onModuleChange("playbook")}>
        <BookOpen className="h-3.5 w-3.5" />
        Voir le Modèle
      </Button>
    </div>
  );
}

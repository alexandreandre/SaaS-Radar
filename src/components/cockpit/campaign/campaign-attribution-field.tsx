"use client";

import { Button } from "@/components/ui/button";

type CampaignAttributionFieldProps = {
  enabled: boolean;
  onEnable: () => void;
};

export function CampaignAttributionField({ enabled, onEnable }: CampaignAttributionFieldProps) {
  if (enabled) {
    return (
      <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
        Question attribution activée sur vos formulaires.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm font-medium">Question « Comment nous avez-vous connu ? »</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Complète le tracking UTM pour le bouche-à-oreille et le dark funnel.
      </p>
      <Button type="button" size="sm" className="mt-3" variant="outline" onClick={onEnable}>
        Activer la question attribution
      </Button>
    </div>
  );
}

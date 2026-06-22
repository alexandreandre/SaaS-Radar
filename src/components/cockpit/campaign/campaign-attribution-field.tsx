"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type CampaignAttributionFieldProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function CampaignAttributionField({ enabled, onChange }: CampaignAttributionFieldProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
      <Checkbox
        id="attribution-question"
        checked={enabled}
        onCheckedChange={(v) => onChange(Boolean(v))}
        className="mt-0.5"
      />
      <div>
        <Label htmlFor="attribution-question" className="text-sm font-medium">
          Question « Comment nous avez-vous connu ? »
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Complète le tracking UTM pour capturer le dark funnel (Slack, bouche-à-oreille, avis).
        </p>
      </div>
    </div>
  );
}

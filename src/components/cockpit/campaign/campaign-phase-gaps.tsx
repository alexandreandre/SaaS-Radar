"use client";

import { AlertCircle } from "lucide-react";
import type { CampaignPhaseGap } from "@/lib/campaign/phases";
import { Button } from "@/components/ui/button";

type CampaignPhaseGapsProps = {
  gaps: CampaignPhaseGap[];
  onGapClick?: (anchorId: string) => void;
  title?: string;
};

export function CampaignPhaseGaps({
  gaps,
  onGapClick,
  title = "Pour débloquer la suite",
}: CampaignPhaseGapsProps) {
  if (gaps.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{title}</p>
          <ul className="space-y-1.5">
            {gaps.map((gap) => (
              <li key={gap.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-amber-800 dark:text-amber-200">{gap.label}</span>
                {onGapClick ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 border-amber-500/40 text-xs"
                    onClick={() => onGapClick(gap.anchorId)}
                  >
                    Compléter
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

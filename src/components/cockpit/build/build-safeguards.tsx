"use client";

import { AlertTriangle, BookOpen, CheckCircle2 } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { isLaunchChecklistItemDone } from "@/lib/portfolio";
import { shouldShowLaunchChecklist } from "@/lib/build-recipe";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type BuildSafeguardsProps = {
  opportunity: Opportunity;
  project: UserProject;
  onToggleLaunchChecklistItem: (itemIndex: number) => void;
  onModuleChange?: (module: CockpitModuleId) => void;
};

export function BuildSafeguards({
  opportunity,
  project,
  onToggleLaunchChecklistItem,
  onModuleChange,
}: BuildSafeguardsProps) {
  const pitfalls = opportunity.mvpPlan.pitfalls ?? [];
  const checklist = opportunity.mvpPlan.launchChecklist ?? [];
  const showLaunchChecklist = shouldShowLaunchChecklist(project, opportunity);

  if (pitfalls.length === 0 && (!showLaunchChecklist || checklist.length === 0)) {
    return null;
  }

  return (
    <details className="rounded-xl border border-border bg-card shadow-card">
      <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
            Ressources
          </p>
          <p className="mt-0.5 font-medium">Pièges &amp; checklist lancement</p>
        </div>
      </summary>

      <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
        {showLaunchChecklist && checklist.length > 0 ? (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Prochaine étape : lancement</h3>
              </div>
              {onModuleChange ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onModuleChange("playbook")}
                >
                  <BookOpen className="h-4 w-4" />
                  Ouvrir la fiche modèle
                </Button>
              ) : null}
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Definition of done avant de passer à la commercialisation.
            </p>
            <ul className="space-y-2">
              {checklist.map((item, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-card p-3 hover:bg-muted/30">
                    <Checkbox
                      checked={isLaunchChecklistItemDone(project, i)}
                      onCheckedChange={() => onToggleLaunchChecklistItem(i)}
                      className="mt-0.5"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {pitfalls.length > 0 ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold">Pièges à éviter</h3>
            </div>
            <ul className="space-y-2">
              {pitfalls.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}

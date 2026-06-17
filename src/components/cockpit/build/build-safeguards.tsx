"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { Checkbox } from "@/components/ui/checkbox";

type BuildSafeguardsProps = {
  opportunity: Opportunity;
};

export function BuildSafeguards({ opportunity }: BuildSafeguardsProps) {
  const pitfalls = opportunity.mvpPlan.pitfalls ?? [];
  const checklist = opportunity.mvpPlan.launchChecklist ?? [];
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  if (pitfalls.length === 0 && checklist.length === 0) return null;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {pitfalls.length > 0 ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5 shadow-card">
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

      {checklist.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Definition of done — lancement</h3>
          </div>
          <ul className="space-y-2">
            {checklist.map((item, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30">
                  <Checkbox
                    checked={checked[i] ?? false}
                    onCheckedChange={(value) =>
                      setChecked((prev) => ({ ...prev, [i]: value === true }))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm">{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

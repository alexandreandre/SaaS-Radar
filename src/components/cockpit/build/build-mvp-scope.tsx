"use client";

import { Ban, Check, Layers } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";

type BuildMvpScopeProps = {
  opportunity: Opportunity;
};

export function BuildMvpScope({ opportunity }: BuildMvpScopeProps) {
  const { mvpPlan } = opportunity;

  return (
    <details className="rounded-xl border border-border bg-muted/20">
      <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2 font-medium">
          <Layers className="h-4 w-4 text-muted-foreground" />
          Périmètre MVP
        </span>
      </summary>
      <div className="space-y-4 border-t border-border px-5 pb-5 pt-2">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Ce que vous construisez
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {mvpPlan.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Ban className="h-3.5 w-3.5" />
            Pas au J1
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {mvpPlan.notYet.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ban className="h-3.5 w-3.5 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

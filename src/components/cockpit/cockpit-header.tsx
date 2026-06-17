"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";

type CockpitHeaderProps = {
  opportunity: Opportunity;
  project?: UserProject;
};

export function CockpitHeader({ opportunity }: CockpitHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex flex-wrap items-center gap-2 font-display text-3xl font-medium tracking-tight">
          {opportunity.name}
          <span className="text-xl" aria-hidden>
            {opportunity.originFlag}
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{opportunity.pitch}</p>
      </div>
    </div>
  );
}

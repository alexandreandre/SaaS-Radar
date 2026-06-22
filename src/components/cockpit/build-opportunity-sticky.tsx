"use client";

import type { Opportunity } from "@/types/opportunity";
import { BuildOpportunityCta } from "@/components/cockpit/build-opportunity-cta";
import { isDiscoveryPhase } from "@/lib/product-phase";

export function BuildOpportunityStickyCta({
  opportunity,
  existingProjectId = null,
}: {
  opportunity: Opportunity;
  existingProjectId?: string | null;
}) {
  if (isDiscoveryPhase()) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md md:hidden">
      <BuildOpportunityCta
        opportunity={opportunity}
        existingProjectId={existingProjectId}
        variant="sticky"
        className="w-full"
      />
    </div>
  );
}

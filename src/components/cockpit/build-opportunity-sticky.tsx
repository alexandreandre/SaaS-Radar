"use client";

import type { Opportunity } from "@/types/opportunity";
import { BuildOpportunityCta } from "@/components/cockpit/build-opportunity-cta";

export function BuildOpportunityStickyCta({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md md:hidden">
      <BuildOpportunityCta opportunity={opportunity} variant="sticky" className="w-full" />
    </div>
  );
}

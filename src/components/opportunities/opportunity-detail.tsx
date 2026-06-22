"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Opportunity } from "@/types/opportunity";
import { sectorLabels } from "@/data/opportunities";
import { DetailHeader } from "@/components/opportunities/detail/detail-header";
import { DetailContent } from "@/components/opportunities/detail/detail-content";
import { BuildOpportunityStickyCta } from "@/components/cockpit/build-opportunity-sticky";

export function OpportunityDetail({
  opportunity,
  existingProjectId = null,
}: {
  opportunity: Opportunity;
  existingProjectId?: string | null;
}) {
  const sector = sectorLabels[opportunity.sector] ?? opportunity.sector;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl bg-background px-4 pb-24 text-foreground mobile-page-pad sm:px-6 md:pb-12">
        <div className="flex items-center justify-between gap-3 pt-3 sm:pt-4">
          <Link
            href="/opportunities"
            aria-label="Retour à la liste"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-muted/60 hover:text-foreground"
          >
            <ArrowLeft className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
          </Link>
          <p className="min-w-0 truncate text-right text-xs text-muted-foreground sm:text-sm">
            <span className="truncate">
              {opportunity.originFlag} {opportunity.originCountry}
            </span>
            <span className="mx-1.5">·</span>
            <span className="truncate">{sector}</span>
          </p>
        </div>

        <DetailHeader
          opportunity={opportunity}
          existingProjectId={existingProjectId}
          meta={{
            publishedAt: opportunity.publishedAt,
            sourceVerified: opportunity.sourceVerified,
            showOriginalLink: true,
          }}
        />

        <DetailContent opportunity={opportunity} />
      </main>
      <BuildOpportunityStickyCta
        opportunity={opportunity}
        existingProjectId={existingProjectId}
      />
      <Footer />
    </>
  );
}

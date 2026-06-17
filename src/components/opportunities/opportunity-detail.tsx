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

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  const sector = sectorLabels[opportunity.sector] ?? opportunity.sector;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl bg-background px-4 pb-24 text-foreground sm:px-6 md:pb-12">
        <div className="flex items-center justify-between gap-4 pt-4">
          <Link
            href="/opportunities"
            aria-label="Retour à la liste"
            className="inline-flex items-center justify-center rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-7 w-7" aria-hidden />
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <p className="text-sm text-muted-foreground">
              <span>
                {opportunity.originFlag} {opportunity.originCountry}
              </span>
              <span className="mx-1.5">·</span>
              <span>{sector}</span>
            </p>
          </div>
        </div>

        <DetailHeader
          opportunity={opportunity}
          meta={{
            publishedAt: opportunity.publishedAt,
            sourceVerified: opportunity.sourceVerified,
            showOriginalLink: true,
          }}
        />

        <DetailContent opportunity={opportunity} />
      </main>
      <BuildOpportunityStickyCta opportunity={opportunity} />
      <Footer />
    </>
  );
}

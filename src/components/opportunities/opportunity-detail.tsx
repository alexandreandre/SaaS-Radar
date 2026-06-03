"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Opportunity } from "@/types/opportunity";
import { sectorLabels } from "@/data/opportunities";
import { DetailHeader } from "@/components/opportunities/detail/detail-header";
import { DetailChecklist } from "@/components/opportunities/detail/detail-checklist";
import { DetailContent } from "@/components/opportunities/detail/detail-content";

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  const sector = sectorLabels[opportunity.sector] ?? opportunity.sector;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl bg-background px-4 pb-12 text-foreground sm:px-6">
        <div className="flex items-center justify-between gap-4 pt-4">
          <Link
            href="/opportunities"
            aria-label="Retour à la liste"
            className="inline-flex items-center justify-center rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-7 w-7" aria-hidden />
          </Link>
          <p className="shrink-0 text-sm text-muted-foreground">
            <span>
              {opportunity.originFlag} {opportunity.originCountry}
            </span>
            <span className="mx-1.5">·</span>
            <span>{sector}</span>
          </p>
        </div>

        <DetailHeader opportunity={opportunity} />

        <div className="flex gap-10">
          <DetailChecklist opportunityName={opportunity.name} />
          <div className="min-w-0 flex-1">
            <DetailContent opportunity={opportunity} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

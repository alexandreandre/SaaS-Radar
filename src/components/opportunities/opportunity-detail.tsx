"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Opportunity } from "@/types/opportunity";
import { DetailHeader } from "@/components/opportunities/detail/detail-header";
import { DetailChecklist } from "@/components/opportunities/detail/detail-checklist";
import { DetailContent } from "@/components/opportunities/detail/detail-content";

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl bg-hero px-4 pb-28 text-hero-foreground sm:px-6 lg:pb-12">
        <Link
          href="/opportunities"
          className="inline-block pt-4 text-sm text-gray-400 transition-colors hover:text-white"
        >
          ← Retour à la liste
        </Link>

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

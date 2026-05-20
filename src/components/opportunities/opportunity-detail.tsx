"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Opportunity } from "@/types/opportunity";
import { DetailHero } from "@/components/opportunities/detail/detail-hero";
import { WhyItWorks } from "@/components/opportunities/detail/why-it-works";
import { TractionSignals } from "@/components/opportunities/detail/traction-signals";
import { DetailFinancialTeaser } from "@/components/opportunities/detail/detail-financial-teaser";
import { DetailConversionPaywall } from "@/components/opportunities/detail/detail-conversion-paywall";
import { StickyCta } from "@/components/opportunities/detail/sticky-cta";

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-28 sm:px-6 lg:pb-12">
        <div className="space-y-1 pt-1 sm:pt-2">
          <Link
            href="/opportunities"
            className="inline-block text-base leading-tight text-muted-foreground hover:text-primary"
          >
            ← Retour à la liste
          </Link>
          <DetailHero opportunity={opportunity} />
        </div>

        <div className="mt-6 space-y-6">
          <WhyItWorks opportunity={opportunity} />
          <TractionSignals opportunity={opportunity} />
          <DetailFinancialTeaser opportunity={opportunity} />
          <DetailConversionPaywall opportunity={opportunity} />
        </div>
      </main>
      <StickyCta />
      <Footer />
    </>
  );
}

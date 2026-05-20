"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Opportunity } from "@/types/opportunity";
import { DetailHero } from "@/components/opportunities/detail/detail-hero";
import { DetailToc } from "@/components/opportunities/detail/detail-toc";
import { WhyItWorks } from "@/components/opportunities/detail/why-it-works";
import { MarketFrance } from "@/components/opportunities/detail/market-france";
import { Revenus } from "@/components/opportunities/detail/revenus";
import { ForeignProduct } from "@/components/opportunities/detail/foreign-product";
import { ClaudePromptSection } from "@/components/opportunities/detail/claude-prompt";
import { FindClients } from "@/components/opportunities/detail/find-clients";
import { ActionGuide } from "@/components/opportunities/detail/action-guide";
import { StickyCta } from "@/components/opportunities/detail/sticky-cta";

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-12">
        <div className="space-y-1 pt-1 sm:pt-2">
          <Link href="/opportunities" className="inline-block text-base leading-tight text-muted-foreground hover:text-primary">
            ← Retour à la liste
          </Link>
          <DetailHero opportunity={opportunity} />
        </div>

        <div className="mt-4 border-t border-border">
          <div className="grid gap-10 pt-4 lg:grid-cols-[240px_1fr] lg:gap-12 lg:pt-6">
            <aside className="lg:sticky lg:top-24 lg:self-start lg:pt-1">
              <DetailToc />
            </aside>
            <div className="min-w-0 space-y-12">
              <WhyItWorks opportunity={opportunity} />
              <MarketFrance opportunity={opportunity} />
              <Revenus opportunity={opportunity} />
              <ForeignProduct opportunity={opportunity} />
              <ClaudePromptSection opportunity={opportunity} />
              <FindClients opportunity={opportunity} />
              <ActionGuide opportunity={opportunity} />
            </div>
          </div>
        </div>
      </main>
      <StickyCta />
      <Footer />
    </>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { Opportunity } from "@/types/opportunity";
import { OpportunitySection } from "@/components/opportunities/detail/opportunity-section";
import { ChiffresSection } from "@/components/opportunities/detail/chiffres-section";
import { WhySection } from "@/components/opportunities/detail/why-section";
import { SaasOrigineSection } from "@/components/opportunities/detail/saas-origine-section";
import { GuideSection } from "@/components/opportunities/detail/guide-section";

const FinancialSection = dynamic(
  () => import("@/components/opportunities/detail/financial-section").then((m) => m.FinancialSection),
  { loading: () => <SectionSkeleton /> }
);

const BusinessPlanSection = dynamic(
  () =>
    import("@/components/opportunities/detail/business-plan-section").then(
      (m) => m.BusinessPlanSection
    ),
  { loading: () => <SectionSkeleton /> }
);

const AcquisitionSection = dynamic(
  () =>
    import("@/components/opportunities/detail/acquisition-section").then(
      (m) => m.AcquisitionSection
    ),
  { loading: () => <SectionSkeleton /> }
);

const ClaudePromptSection = dynamic(
  () =>
    import("@/components/opportunities/detail/claude-prompt-section").then(
      (m) => m.ClaudePromptSection
    ),
  { loading: () => <SectionSkeleton /> }
);

function SectionSkeleton() {
  return <div className="my-8 h-32 animate-pulse rounded-lg border border-border bg-muted/40" />;
}

export function DetailContent({ opportunity }: { opportunity: Opportunity }) {
  return (
    <>
      <OpportunitySection opportunity={opportunity} animationIndex={0} />
      <ChiffresSection opportunity={opportunity} animationIndex={1} />
      <FinancialSection opportunity={opportunity} animationIndex={2} />
      <WhySection opportunity={opportunity} animationIndex={3} />
      <SaasOrigineSection opportunity={opportunity} animationIndex={4} />
      <BusinessPlanSection opportunity={opportunity} animationIndex={5} />
      <AcquisitionSection opportunity={opportunity} animationIndex={6} />
      <ClaudePromptSection opportunity={opportunity} animationIndex={7} />
      <GuideSection opportunity={opportunity} animationIndex={8} />
    </>
  );
}

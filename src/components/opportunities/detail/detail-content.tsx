"use client";

import dynamic from "next/dynamic";
import type { Opportunity } from "@/types/opportunity";
import { OpportunitySection } from "@/components/opportunities/detail/opportunity-section";
import { ChiffresSection } from "@/components/opportunities/detail/chiffres-section";
import { WhySection } from "@/components/opportunities/detail/why-section";
import { SaasOrigineSection } from "@/components/opportunities/detail/saas-origine-section";
import { GuideSection } from "@/components/opportunities/detail/guide-section";
import { DetailChecklist } from "@/components/opportunities/detail/detail-checklist";

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

export function DetailContent({
  opportunity,
  variant = "page",
}: {
  opportunity: Opportunity;
  variant?: "page" | "embedded";
}) {
  const sectionsFrom2 = (
    <>
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

  if (variant === "embedded") {
    return (
      <>
        <OpportunitySection opportunity={opportunity} animationIndex={0} />
        {sectionsFrom2}
      </>
    );
  }

  return (
    <>
      <div className="flex gap-10">
        <DetailChecklist opportunityName={opportunity.name} />
        <div className="min-w-0 flex-1">
          <OpportunitySection opportunity={opportunity} animationIndex={0} />
        </div>
      </div>
      <div className="w-full">{sectionsFrom2}</div>
    </>
  );
}

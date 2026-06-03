import type { Opportunity } from "@/types/opportunity";
import { OpportunitySection } from "@/components/opportunities/detail/opportunity-section";
import { ChiffresSection } from "@/components/opportunities/detail/chiffres-section";
import { FinancialSection } from "@/components/opportunities/detail/financial-section";
import { WhySection } from "@/components/opportunities/detail/why-section";
import { SaasOrigineSection } from "@/components/opportunities/detail/saas-origine-section";
import { BusinessPlanSection } from "@/components/opportunities/detail/business-plan-section";
import { AcquisitionSection } from "@/components/opportunities/detail/acquisition-section";
import { ClaudePromptSection } from "@/components/opportunities/detail/claude-prompt-section";
import { GuideSection } from "@/components/opportunities/detail/guide-section";

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

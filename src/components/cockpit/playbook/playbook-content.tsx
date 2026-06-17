"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Hammer } from "lucide-react";
import dynamic from "next/dynamic";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { OpportunitySection } from "@/components/opportunities/detail/opportunity-section";
import { ChiffresSection } from "@/components/opportunities/detail/chiffres-section";
import { WhySection } from "@/components/opportunities/detail/why-section";
import { SaasOrigineSection } from "@/components/opportunities/detail/saas-origine-section";
import { PlaybookSection, PlaybookSections } from "@/components/cockpit/playbook/playbook-section";
import {
  PlaybookFinanceBridge,
  PlaybookFinancesContextBanner,
} from "@/components/cockpit/playbook/playbook-finances-context";

const FinancialSection = dynamic(
  () => import("@/components/opportunities/detail/financial-section").then((m) => m.FinancialSection),
  { loading: () => <div className="h-24 animate-pulse rounded-lg bg-muted/40" /> },
);

const BusinessPlanSection = dynamic(
  () =>
    import("@/components/opportunities/detail/business-plan-section").then(
      (m) => m.BusinessPlanSection,
    ),
  { loading: () => <div className="h-24 animate-pulse rounded-lg bg-muted/40" /> },
);

const AcquisitionSection = dynamic(
  () =>
    import("@/components/opportunities/detail/acquisition-section").then(
      (m) => m.AcquisitionSection,
    ),
  { loading: () => <div className="h-24 animate-pulse rounded-lg bg-muted/40" /> },
);

export const PLAYBOOK_TAB_IDS = ["opportunity", "finances", "clients"] as const;
export type PlaybookTab = (typeof PLAYBOOK_TAB_IDS)[number];

const LEGACY_PLAYBOOK_TABS = ["prompt", "guide"] as const;

export function isPlaybookTab(value: string): value is PlaybookTab {
  return PLAYBOOK_TAB_IDS.includes(value as PlaybookTab);
}

function normalizePlaybookTab(value: string | null): PlaybookTab {
  if (value && isPlaybookTab(value)) return value;
  return "opportunity";
}

type PlaybookContentProps = {
  opportunity: Opportunity;
  defaultTab?: string;
  showHeader?: boolean;
  className?: string;
  project?: UserProject;
  data?: CockpitData;
  onModuleChange?: (module: CockpitModuleId) => void;
  syncTabToUrl?: boolean;
  inDrawer?: boolean;
  onTabChange?: (tab: PlaybookTab) => void;
};

export function PlaybookContent({
  opportunity,
  defaultTab = "opportunity",
  showHeader = true,
  className,
  project,
  data,
  onModuleChange,
  syncTabToUrl = false,
  onTabChange,
}: PlaybookContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = syncTabToUrl ? searchParams.get("tab") : null;
  const resolvedDefault = normalizePlaybookTab(
    urlTab && isPlaybookTab(urlTab)
      ? urlTab
      : isPlaybookTab(defaultTab)
        ? defaultTab
        : "opportunity",
  );

  const [tab, setTab] = useState<PlaybookTab>(resolvedDefault);

  useEffect(() => {
    if (isPlaybookTab(defaultTab)) {
      setTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    if (!syncTabToUrl || !urlTab) return;

    if (LEGACY_PLAYBOOK_TABS.includes(urlTab as (typeof LEGACY_PLAYBOOK_TABS)[number])) {
      onModuleChange?.("build");
      return;
    }

    if (isPlaybookTab(urlTab)) {
      setTab(urlTab);
    }
  }, [syncTabToUrl, urlTab, onModuleChange]);

  const handleTabChange = useCallback(
    (value: string) => {
      if (!isPlaybookTab(value)) return;
      setTab(value);
      onTabChange?.(value);
      if (syncTabToUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("module", "playbook");
        params.set("tab", value);
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    },
    [router, searchParams, syncTabToUrl, onTabChange],
  );

  const hasCockpitContext = Boolean(project && data);

  return (
    <div className={className}>
      {showHeader ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="shrink-0 text-base font-semibold tracking-tight">
              {opportunity.name}
            </h2>
            <p className="min-w-0 max-w-xl truncate text-sm text-muted-foreground">
              {opportunity.pitch}
            </p>
            {onModuleChange ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1.5"
                onClick={() => onModuleChange("build")}
              >
                <Hammer className="h-3.5 w-3.5" />
                Ouvrir Build
              </Button>
            ) : null}
          </div>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href={`/opportunities/${opportunity.slug}`} target="_blank">
              Plein écran
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="w-full shrink-0 gap-0 overflow-x-auto">
          <TabsTrigger value="opportunity" className="flex-1 px-2">
            Le modèle
          </TabsTrigger>
          <TabsTrigger value="finances" className="flex-1 px-2">
            Projections FR
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex-1 px-2">
            Trouver des clients
          </TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 pt-4">
          <TabsContent value="opportunity" className="mt-0">
            <PlaybookSections>
              <PlaybookSection>
                <OpportunitySection opportunity={opportunity} animationIndex={0} variant="playbook" />
              </PlaybookSection>
              <PlaybookSection>
                <ChiffresSection opportunity={opportunity} animationIndex={1} variant="playbook" />
              </PlaybookSection>
              <PlaybookSection>
                <WhySection opportunity={opportunity} animationIndex={2} variant="playbook" />
              </PlaybookSection>
              <PlaybookSection>
                <SaasOrigineSection opportunity={opportunity} animationIndex={3} variant="playbook" />
              </PlaybookSection>
            </PlaybookSections>
          </TabsContent>

          <TabsContent value="finances" className="mt-0">
            <PlaybookSections>
              {hasCockpitContext ? (
                <PlaybookFinancesContextBanner onModuleChange={onModuleChange} />
              ) : null}
              <PlaybookSection>
                <FinancialSection
                  opportunity={opportunity}
                  animationIndex={0}
                  variant="playbook"
                  targetScenario={project?.targetScenario}
                />
              </PlaybookSection>
              <PlaybookSection>
                <BusinessPlanSection
                  opportunity={opportunity}
                  animationIndex={1}
                  variant="playbook"
                  project={project}
                  chartData={data?.chartData}
                  targetMrr={data?.target}
                  gap={data?.gap}
                />
              </PlaybookSection>
              {hasCockpitContext && project && data ? (
                <PlaybookFinanceBridge
                  project={project}
                  data={data}
                  onModuleChange={onModuleChange}
                />
              ) : null}
            </PlaybookSections>
          </TabsContent>

          <TabsContent value="clients" className="mt-0">
            <PlaybookSections>
              <PlaybookSection>
                <AcquisitionSection
                  opportunity={opportunity}
                  animationIndex={0}
                  variant="playbook"
                  project={project}
                  data={data}
                  onModuleChange={onModuleChange}
                />
              </PlaybookSection>
            </PlaybookSections>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

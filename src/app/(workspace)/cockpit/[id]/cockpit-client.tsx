"use client";

import { notFound, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { usePortfolio } from "@/contexts/portfolio-context";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { resolveCockpitOpportunity } from "@/lib/idea/to-opportunity";
import { shouldShowLaunchPad } from "@/lib/build-launch";
import { syncBuildMilestones } from "@/lib/portfolio";
import { CockpitProjectIdentity } from "@/components/cockpit/cockpit-project-identity";
import { CockpitModuleSkeleton } from "@/components/cockpit/cockpit-module-skeleton";
import { PortfolioSyncStatus } from "@/components/portfolio/portfolio-sync-status";
import { useCockpitData } from "@/hooks/use-cockpit-data";
import { useAutoSyncIntegrations } from "@/hooks/use-auto-sync-integrations";
import { primeOpportunityCache } from "@/lib/opportunity-catalog-client";

const CockpitShell = dynamic(
  () => import("@/components/cockpit/cockpit-shell").then((m) => ({ default: m.CockpitShell })),
  { loading: () => <CockpitModuleSkeleton /> },
);

type CockpitLoadedProps = {
  project: UserProject;
  opportunity: Opportunity;
  inLaunchPad: boolean;
};

function CockpitLoaded({ project, opportunity, inLaunchPad }: CockpitLoadedProps) {
  const {
    recordMrr,
    toggleMilestone,
    updateProject,
    addCampaign,
    updateCampaign,
    removeCampaign,
    addExpense,
    removeExpense,
    connectIntegration,
    syncIntegration,
    disconnectIntegration,
    patchIntegration,
    logMetricsSnapshot,
    setCashOnHand,
    completeOnboarding,
  } = usePortfolio();

  useAutoSyncIntegrations(project.id);

  const data = useCockpitData(project, opportunity);

  useEffect(() => {
    const synced = syncBuildMilestones(project, opportunity);
    if (synced.milestones.length !== project.milestones.length) {
      updateProject(project.id, { milestones: synced.milestones });
      return;
    }
    const idsDiffer = synced.milestones.some(
      (m, i) => project.milestones[i]?.id !== m.id,
    );
    if (idsDiffer) {
      updateProject(project.id, { milestones: synced.milestones });
    }
  }, [project, updateProject, opportunity]);

  const shellProps = {
    project,
    opportunity,
    data,
    onRecordMrr: (amount: number, note?: string) => recordMrr(project.id, amount, note),
    onToggleMilestone: (id: string) => toggleMilestone(project.id, id),
    onAddCampaign: (c: Parameters<typeof addCampaign>[1]) => addCampaign(project.id, c),
    onUpdateCampaign: (id: string, patch: Parameters<typeof updateCampaign>[2]) =>
      updateCampaign(project.id, id, patch),
    onRemoveCampaign: (id: string) => removeCampaign(project.id, id),
    onAddExpense: (e: Parameters<typeof addExpense>[1]) => addExpense(project.id, e),
    onRemoveExpense: (id: string) => removeExpense(project.id, id),
    onConnectIntegration: (
      cid: Parameters<typeof connectIntegration>[1],
      options?: Parameters<typeof connectIntegration>[2],
    ) => connectIntegration(project.id, cid, options),
    onSyncIntegration: (cid: Parameters<typeof syncIntegration>[1]) =>
      syncIntegration(project.id, cid),
    onDisconnectIntegration: (cid: Parameters<typeof disconnectIntegration>[1]) =>
      disconnectIntegration(project.id, cid),
    onPatchIntegration: (
      cid: Parameters<typeof patchIntegration>[1],
      patch: Parameters<typeof patchIntegration>[2],
    ) => patchIntegration(project.id, cid, patch),
    onLogMetrics: (partial: Parameters<typeof logMetricsSnapshot>[1]) =>
      logMetricsSnapshot(project.id, partial),
    onSetCashOnHand: (amount: number) => setCashOnHand(project.id, amount),
    onCompleteOnboarding: () => completeOnboarding(project.id),
  };

  if (inLaunchPad) {
    return (
      <>
        <div className="mb-4 flex justify-end">
          <PortfolioSyncStatus projectId={project.id} />
        </div>
        <CockpitProjectIdentity
          project={project}
          opportunity={opportunity}
          className="mb-6 border-b-0 pb-0"
        />
        <CockpitShell {...shellProps} />
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <PortfolioSyncStatus projectId={project.id} />
      </div>
      <CockpitShell {...shellProps} />
    </>
  );
}

export type CockpitPageClientProps = {
  projectId: string;
  initialProject: UserProject | null;
  initialOpportunity: Opportunity | null;
};

export function CockpitPageClient({
  projectId,
  initialProject,
  initialOpportunity,
}: CockpitPageClientProps) {
  const searchParams = useSearchParams();
  const { hydrated, getProjectById, getCatalogOpportunity, registerProject } = usePortfolio();

  useEffect(() => {
    if (initialOpportunity) primeOpportunityCache(initialOpportunity);
  }, [initialOpportunity]);

  useEffect(() => {
    if (!initialProject || !hydrated) return;
    if (!getProjectById(initialProject.id)) {
      registerProject(initialProject);
    }
  }, [initialProject, hydrated, getProjectById, registerProject]);

  const project = hydrated ? getProjectById(projectId) : (initialProject ?? undefined);
  const catalogOpportunity = useMemo(() => {
    if (!project?.opportunitySlug) return initialOpportunity;
    return getCatalogOpportunity(project.opportunitySlug) ?? initialOpportunity;
  }, [project, getCatalogOpportunity, initialOpportunity]);

  const opportunity = useMemo(
    () => (project ? resolveCockpitOpportunity(project, catalogOpportunity) : null),
    [project, catalogOpportunity],
  );

  if (!hydrated && !initialProject) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </main>
      </>
    );
  }

  if (!project || !opportunity) {
    if (hydrated) notFound();
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </main>
      </>
    );
  }

  const welcomeIdea = searchParams.get("welcome") === "idea";
  const inLaunchPad =
    !welcomeIdea &&
    shouldShowLaunchPad(project) &&
    searchParams.get("module") !== "build";

  return (
    <>
      <Navbar />
      <main className={cn(inLaunchPad && "mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:max-w-4xl")}>
        <CockpitLoaded project={project} opportunity={opportunity} inLaunchPad={inLaunchPad} />
      </main>
    </>
  );
}

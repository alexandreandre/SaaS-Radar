"use client";

import { notFound, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { usePortfolio } from "@/contexts/portfolio-context";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { shouldShowLaunchPad } from "@/lib/build-launch";
import { syncBuildMilestones } from "@/lib/portfolio";
import { CockpitProjectIdentity } from "@/components/cockpit/cockpit-project-identity";
import { CockpitModuleSkeleton } from "@/components/cockpit/cockpit-module-skeleton";
import { useCockpitData } from "@/hooks/use-cockpit-data";

const CockpitShell = dynamic(
  () => import("@/components/cockpit/cockpit-shell").then((m) => ({ default: m.CockpitShell })),
  { loading: () => <CockpitModuleSkeleton /> }
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
    logMetricsSnapshot,
    setCashOnHand,
    completeOnboarding,
  } = usePortfolio();

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
  }, [project.id, project.milestones, opportunity.slug, updateProject, opportunity]);

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
    onLogMetrics: (partial: Parameters<typeof logMetricsSnapshot>[1]) =>
      logMetricsSnapshot(project.id, partial),
    onSetCashOnHand: (amount: number) => setCashOnHand(project.id, amount),
    onCompleteOnboarding: () => completeOnboarding(project.id),
  };

  if (inLaunchPad) {
    return (
      <>
        <CockpitProjectIdentity
          project={project}
          opportunity={opportunity}
          className="mb-6 border-b-0 pb-0"
        />
        <CockpitShell {...shellProps} />
      </>
    );
  }

  return <CockpitShell {...shellProps} />;
}

export default function CockpitPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const { hydrated, getProjectById, getCatalogOpportunity } = usePortfolio();
  const project = getProjectById(params.id);
  const opportunity = useMemo(
    () => (project ? getCatalogOpportunity(project.opportunitySlug) : null),
    [project, getCatalogOpportunity]
  );

  if (!hydrated) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </main>
      </>
    );
  }

  if (!project || !opportunity) notFound();

  const inLaunchPad =
    shouldShowLaunchPad(project) && searchParams.get("module") !== "build";

  return (
    <>
      <Navbar />
      <main className={cn(inLaunchPad && "mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:max-w-4xl")}>
        <CockpitLoaded project={project} opportunity={opportunity} inLaunchPad={inLaunchPad} />
      </main>
    </>
  );
}

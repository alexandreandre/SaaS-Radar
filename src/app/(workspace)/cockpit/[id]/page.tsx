"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { usePortfolio } from "@/contexts/portfolio-context";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { CockpitHeader } from "@/components/cockpit/cockpit-header";
import { CockpitShell } from "@/components/cockpit/cockpit-shell";
import { useCockpitData } from "@/hooks/use-cockpit-data";

type CockpitLoadedProps = {
  project: UserProject;
  opportunity: Opportunity;
};

function CockpitLoaded({ project, opportunity }: CockpitLoadedProps) {
  const {
    recordMrr,
    toggleMilestone,
    updateProject,
    setProjectPhase,
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
  } = usePortfolio();

  const data = useCockpitData(project, opportunity);

  return (
    <>
      <Link
        href="/mes-saas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Mes SaaS développés
      </Link>

      <div className="mt-6">
        <CockpitHeader
          project={project}
          opportunity={opportunity}
          data={data}
          onPhaseChange={(phase) => setProjectPhase(project.id, phase)}
          onScenarioChange={(scenario) => updateProject(project.id, { targetScenario: scenario })}
        />
      </div>

      <CockpitShell
        project={project}
        opportunity={opportunity}
        data={data}
        onRecordMrr={(amount, note) => recordMrr(project.id, amount, note)}
        onToggleMilestone={(id) => toggleMilestone(project.id, id)}
        onAddCampaign={(c) => addCampaign(project.id, c)}
        onUpdateCampaign={(id, patch) => updateCampaign(project.id, id, patch)}
        onRemoveCampaign={(id) => removeCampaign(project.id, id)}
        onAddExpense={(e) => addExpense(project.id, e)}
        onRemoveExpense={(id) => removeExpense(project.id, id)}
        onConnectIntegration={(cid) => connectIntegration(project.id, cid)}
        onSyncIntegration={(cid) => syncIntegration(project.id, cid)}
        onDisconnectIntegration={(cid) => disconnectIntegration(project.id, cid)}
        onLogMetrics={(partial) => logMetricsSnapshot(project.id, partial)}
        onSetCashOnHand={(amount) => setCashOnHand(project.id, amount)}
      />
    </>
  );
}

function CockpitPageContent({ projectId }: { projectId: string }) {
  const { hydrated, getProjectById, getCatalogOpportunity } = usePortfolio();
  const project = getProjectById(projectId);
  const opportunity = useMemo(
    () => (project ? getCatalogOpportunity(project.opportunitySlug) : null),
    [project, getCatalogOpportunity]
  );

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  if (!project || !opportunity) notFound();

  return <CockpitLoaded project={project} opportunity={opportunity} />;
}

export default function CockpitPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
          <CockpitPageContent projectId={params.id} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

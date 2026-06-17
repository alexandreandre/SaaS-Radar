"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  getFirstLaunchAction,
  getLaunchPadView,
} from "@/lib/build-launch";
import { Button } from "@/components/ui/button";
import { CelebrationOverlay } from "@/components/cockpit/celebration-overlay";
import { PlaybookDrawer } from "@/components/cockpit/playbook/playbook-drawer";
import { isPlaybookTab } from "@/components/cockpit/playbook/playbook-content";
import { HeroAction } from "@/components/cockpit/launch-pad/hero-action";
import { LaunchPadProgress } from "@/components/cockpit/launch-pad/launch-pad-progress";
import { WeekTracker } from "@/components/cockpit/launch-pad/week-tracker";
import { ResourcesStrip } from "@/components/cockpit/launch-pad/resources-strip";
import { MrrCheckIn } from "@/components/cockpit/mrr-check-in";
import { useCockpitData } from "@/hooks/use-cockpit-data";

type LaunchPadProps = {
  project: UserProject;
  opportunity: Opportunity;
  onToggleMilestone: (milestoneId: string) => void;
  onRecordMrr: (amount: number, note?: string) => void;
  onCompleteOnboarding: () => void;
  onOpenBuild?: () => void;
};

export function LaunchPad({
  project,
  opportunity,
  onToggleMilestone,
  onRecordMrr,
  onCompleteOnboarding,
  onOpenBuild,
}: LaunchPadProps) {
  const searchParams = useSearchParams();
  const view = getLaunchPadView(project, opportunity);
  const data = useCockpitData(project, opportunity);
  const [modelDrawerOpen, setModelDrawerOpen] = useState(false);
  const [modelTab, setModelTab] = useState<string>("opportunity");
  const [celebration, setCelebration] = useState<string | null>(null);
  const [showCompleteCelebration, setShowCompleteCelebration] = useState(false);

  const openModel = (tab?: string) => {
    if (tab) setModelTab(tab);
    setModelDrawerOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("module") !== "playbook") return;
    const tab = searchParams.get("tab");
    setModelTab(tab && isPlaybookTab(tab) ? tab : "opportunity");
    setModelDrawerOpen(true);
  }, [searchParams]);

  const handleToggle = (milestoneId: string) => {
    const milestone = project.milestones.find((m) => m.id === milestoneId);
    const markingDone = milestone && !milestone.done;
    onToggleMilestone(milestoneId);

    if (markingDone) {
      const newDone = project.milestones.filter((m) => m.done || m.id === milestoneId).length;
      if (newDone >= 3) {
        setShowCompleteCelebration(true);
      } else if (newDone === 1) {
        setCelebration("Première étape validée — continuez !");
      } else {
        setCelebration(`Étape ${newDone}/3 — vous avancez bien`);
      }
    }
  };

  const isHasMrr = project.builderStage === "has_mrr";

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LaunchPadProgress
          project={project}
          currentWeek={view.currentWeek}
          weekGoal={view.weekGoal}
          onCompleteEarly={onCompleteOnboarding}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => openModel()}>
          <BookOpen className="h-4 w-4" />
          Voir la fiche {opportunity.name}
        </Button>
      </div>

      {isHasMrr ? (
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="font-data text-[10px] uppercase tracking-data text-primary">
            MRR actuel
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Mettez à jour votre revenu pour suivre votre trajectoire.
          </p>
          <div className="mt-4">
            <MrrCheckIn project={project} onRecord={onRecordMrr} compact />
          </div>
        </section>
      ) : null}

      <HeroAction
        milestone={view.nextMilestone}
        fallbackLabel={getFirstLaunchAction(opportunity)}
        onToggle={handleToggle}
      />

      <WeekTracker
        opportunity={opportunity}
        project={project}
        onToggle={handleToggle}
        heroMilestoneId={view.nextMilestone?.id}
      />

      <ResourcesStrip
        opportunity={opportunity}
        onOpenModel={openModel}
        onOpenBuild={onOpenBuild}
      />

      <p className="text-center text-xs text-muted-foreground">
        KPI Semaine {view.currentWeek} : {view.weekKpi}
      </p>

      <PlaybookDrawer
        opportunity={opportunity}
        open={modelDrawerOpen}
        onOpenChange={setModelDrawerOpen}
        defaultTab={modelTab}
        project={project}
        data={data}
      />

      <CelebrationOverlay
        show={celebration !== null}
        message={celebration ?? ""}
        variant="milestone"
        onDone={() => setCelebration(null)}
      />

      <CelebrationOverlay
        show={showCompleteCelebration || project.onboardingCompleted === true}
        message="Cockpit complet débloqué — bon build !"
        variant="complete"
        onDone={() => setShowCompleteCelebration(false)}
      />
    </div>
  );
}

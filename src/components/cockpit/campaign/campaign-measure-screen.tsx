"use client";

import { useMemo } from "react";
import type { UserProject } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { CampaignWeeklyCheckIn } from "@/lib/campaign/kits";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import { getMeasureGaps } from "@/lib/campaign/phases";
import { CampaignMetricsPanel } from "@/components/cockpit/campaign/campaign-metrics-panel";
import { CampaignWeeklyCheckInForm } from "@/components/cockpit/campaign/campaign-weekly-checkin";
import { CampaignRetrospectiveCard } from "@/components/cockpit/campaign/campaign-retrospective";
import { CampaignConnectorStrip } from "@/components/cockpit/campaign/campaign-connector-strip";
import { CampaignPhaseGaps } from "@/components/cockpit/campaign/campaign-phase-gaps";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ConnectorId } from "@/lib/connectors/types";

type CampaignMeasureScreenProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  metricsData?: CockpitData;
  showAcquisitionHandoff: boolean;
  onConnectIntegration: (id: ConnectorId) => void;
  onWeeklyCheckIn: (checkIn: CampaignWeeklyCheckIn) => void;
  onCompleteRetrospective: (data: {
    worked: string;
    blocked: string;
    nextChange: string;
  }) => void;
  onStartNewCycle: () => void;
  onModuleChange: (module: CockpitModuleId) => void;
  onAddMarketFitNote: (note: string) => void;
  onNavigate?: (anchorId: string) => void;
};

function formatCheckInCadence(lastDate?: string): string {
  if (!lastDate) {
    return "Revenez chaque semaine — faites votre premier check-in (2 min).";
  }
  const last = new Date(lastDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince >= 7) {
    return `Dernier check-in : ${lastDate} — il est temps de faire le point.`;
  }
  return `Dernier check-in : ${lastDate} — prochain conseillé dans ${7 - daysSince} jour(s).`;
}

export function CampaignMeasureScreen({
  project,
  opportunity,
  stage,
  channel,
  metricsData,
  showAcquisitionHandoff,
  onConnectIntegration,
  onWeeklyCheckIn,
  onCompleteRetrospective,
  onStartNewCycle,
  onModuleChange,
  onAddMarketFitNote,
  onNavigate,
}: CampaignMeasureScreenProps) {
  const setup = project.campaignSetup;
  const metric = setup?.smartGoal?.metric;
  const suggestedValue =
    metric === "conversations" ? undefined : metricsData?.metrics.latest?.signups;
  const gaps = getMeasureGaps(setup);
  const checkIns = setup?.weeklyCheckIns ?? [];
  const lastCheckIn = checkIns[checkIns.length - 1]?.date;
  const cadenceHint = useMemo(() => formatCheckInCadence(lastCheckIn), [lastCheckIn]);
  const hasCheckIn = checkIns.length > 0;

  return (
    <div id="measure-screen" className="space-y-4">
      {!hasCheckIn ? <CampaignPhaseGaps gaps={gaps} onGapClick={onNavigate} /> : null}

      <div id="measure-checkin" className="rounded-xl border border-primary/20 bg-primary/5 p-1">
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-primary">Action de la semaine</p>
          <p className="text-sm text-muted-foreground">{cadenceHint}</p>
        </div>
        <CampaignWeeklyCheckInForm
          checkIns={checkIns}
          smartGoal={setup?.smartGoal}
          suggestedMetricValue={suggestedValue}
          onSubmit={onWeeklyCheckIn}
          prominent
        />
      </div>

      {metricsData ? (
        <CampaignMetricsPanel
          opportunity={opportunity}
          channel={channel}
          latest={metricsData.metrics.latest}
          smartGoalTarget={setup?.smartGoal?.targetValue}
          smartGoalCurrent={checkIns[checkIns.length - 1]?.metricValue}
        />
      ) : null}

      <CampaignConnectorStrip
        project={project}
        stage={stage}
        channel={channel}
        variant="analytics"
        onConnect={onConnectIntegration}
      />

      <details className="group rounded-xl border border-border bg-card shadow-card">
        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
          Verbatim message-market fit
          {(setup?.messageMarketFitNotes ?? []).length > 0
            ? ` (${setup!.messageMarketFitNotes!.length})`
            : ""}
        </summary>
        <div className="border-t border-border px-5 pb-5 pt-3">
          <p className="text-xs text-muted-foreground">
            Notez les mots exacts de vos prospects après un call.
          </p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const note = String(fd.get("note") ?? "").trim();
              if (note) onAddMarketFitNote(note);
              e.currentTarget.reset();
            }}
          >
            <Input name="note" placeholder="« On perd 2h par semaine sur… »" className="flex-1" />
            <Button type="submit" size="sm">
              Ajouter
            </Button>
          </form>
          {(setup?.messageMarketFitNotes ?? []).length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {setup!.messageMarketFitNotes!.map((n, i) => (
                <li key={i}>· {n}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </details>

      <details
        id="measure-retro"
        open={setup?.cycleStatus === "completed"}
        className="group rounded-xl border border-border bg-card shadow-card"
      >
        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
          Rétrospective de cycle
        </summary>
        <div className="border-t border-border px-5 pb-5 pt-3">
          <CampaignRetrospectiveCard
            completed={setup?.cycleStatus === "completed"}
            onComplete={onCompleteRetrospective}
            onStartNewCycle={onStartNewCycle}
          />
        </div>
      </details>

      {showAcquisitionHandoff ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={() => onModuleChange("acquisition")}>
            Ouvrir Acquisition (ROAS)
          </Button>
        </div>
      ) : null}
    </div>
  );
}

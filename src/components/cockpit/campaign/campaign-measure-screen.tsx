"use client";

import type { UserProject } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { CampaignWeeklyCheckIn } from "@/lib/campaign/kits";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import { CampaignMetricsPanel } from "@/components/cockpit/campaign/campaign-metrics-panel";
import { CampaignWeeklyCheckInForm } from "@/components/cockpit/campaign/campaign-weekly-checkin";
import { CampaignRetrospectiveCard } from "@/components/cockpit/campaign/campaign-retrospective";
import { CampaignConnectorStrip } from "@/components/cockpit/campaign/campaign-connector-strip";
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
};

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
}: CampaignMeasureScreenProps) {
  const setup = project.campaignSetup;
  const metric = setup?.smartGoal?.metric;
  const suggestedValue =
    metric === "conversations"
      ? undefined
      : metricsData?.metrics.latest?.signups;

  return (
    <div id="measure-screen" className="space-y-4">
      {metricsData ? (
        <CampaignMetricsPanel
          opportunity={opportunity}
          channel={channel}
          latest={metricsData.metrics.latest}
          smartGoalTarget={setup?.smartGoal?.targetValue}
          smartGoalCurrent={
            setup?.weeklyCheckIns?.[setup.weeklyCheckIns.length - 1]?.metricValue
          }
        />
      ) : null}

      <CampaignConnectorStrip
        project={project}
        stage={stage}
        channel={channel}
        variant="analytics"
        onConnect={onConnectIntegration}
      />

      <CampaignWeeklyCheckInForm
        checkIns={setup?.weeklyCheckIns ?? []}
        smartGoal={setup?.smartGoal}
        suggestedMetricValue={suggestedValue}
        onSubmit={onWeeklyCheckIn}
      />

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold">Verbatim message-market fit</h3>
        <p className="mt-1 text-xs text-muted-foreground">
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
      </section>

      <CampaignRetrospectiveCard
        completed={setup?.cycleStatus === "completed"}
        onComplete={onCompleteRetrospective}
        onStartNewCycle={onStartNewCycle}
      />

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

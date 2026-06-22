"use client";

import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getStageDefinition } from "@/lib/campaign/stages";
import { getConnector } from "@/lib/connectors/registry";
import type { ConnectorId } from "@/lib/connectors/types";
import { Button } from "@/components/ui/button";

const ANALYTICS: ConnectorId[] = ["plausible", "posthog", "google-analytics"];
const ADS: ConnectorId[] = ["meta-ads", "google-ads", "linkedin-ads", "tiktok-ads"];
const CRM: ConnectorId[] = ["hubspot", "pipedrive"];

type CampaignConnectorStripProps = {
  project: UserProject;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  variant?: "all" | "analytics";
  onConnect: (id: ConnectorId) => void;
};

export function CampaignConnectorStrip({
  project,
  stage,
  channel,
  variant = "all",
  onConnect,
}: CampaignConnectorStripProps) {
  const stageDef = getStageDefinition(stage);
  let ids: ConnectorId[] =
    variant === "analytics" ? ANALYTICS : [...ANALYTICS, ...CRM];
  if (variant === "all" && stageDef.showPaidAds) {
    ids = [...ids, ...ADS.filter((id) => {
      if (channel === "meta") return id === "meta-ads";
      if (channel === "google") return id === "google-ads";
      if (channel === "linkedin") return id === "linkedin-ads";
      if (channel === "tiktok") return id === "tiktok-ads";
      return false;
    })];
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold">Connecteurs</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {ids.map((id) => {
          const connected = (project.integrations ?? []).some(
            (i) =>
              i.connectorId === id &&
              (i.status === "connected" || i.status === "demo"),
          );
          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={connected ? "secondary" : "outline"}
              onClick={() => onConnect(id)}
            >
              {getConnector(id)?.name ?? id}
              {connected ? " ✓" : ""}
            </Button>
          );
        })}
      </div>
    </section>
  );
}

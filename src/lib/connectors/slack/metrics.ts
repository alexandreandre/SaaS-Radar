import "server-only";

import { buildCockpitAlerts } from "@/lib/cockpit-alerts";
import { buildCockpitMetrics } from "@/lib/cockpit-metrics";
import {
  buildCommsStreamFromStats,
  filterUndeliveredAlerts,
  formatSlackAlertBlocks,
  formatSlackWelcomeBlocks,
  trimDeliveredAlertIds,
} from "@/lib/connectors/slack/alert-dispatch";
import { authTest, postMessage } from "@/lib/connectors/slack/client";
import type { SlackCredential } from "@/lib/connectors/slack/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";
import type { UserProject } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";

function cockpitBaseUrl(projectId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/cockpit/${projectId}`;
}

export async function fetchSlackConnectorSync(
  credential: SlackCredential,
  opts: {
    project: UserProject;
    opportunity?: Opportunity | null;
    projectId: string;
    sendWelcome?: boolean;
  },
): Promise<ConnectorSyncResult & { refreshedCredential: SlackCredential }> {
  const auth = await authTest(credential.botAccessToken);
  let nextCredential: SlackCredential = {
    ...credential,
    teamId: auth.team_id ?? credential.teamId,
    teamName: auth.team ?? credential.teamName,
    botUserId: auth.user_id ?? credential.botUserId,
    alertsSent: credential.alertsSent ?? 0,
    deliveredAlertIds: credential.deliveredAlertIds ?? [],
    lastAlertAt: credential.lastAlertAt ?? null,
  };

  if (!nextCredential.channelId) {
    throw new Error("Canal Slack non configuré — sélectionnez un canal pour recevoir les alertes.");
  }

  if (opts.sendWelcome) {
    const welcome = formatSlackWelcomeBlocks(nextCredential.channelName);
    await postMessage(nextCredential.botAccessToken, nextCredential.channelId, welcome);
  }

  const metrics = opts.opportunity
    ? buildCockpitMetrics(opts.project, opts.opportunity)
    : null;
  const alerts =
    metrics && opts.opportunity
      ? buildCockpitAlerts(opts.project, metrics, opts.opportunity)
      : [];
  const pending = filterUndeliveredAlerts(alerts, nextCredential.deliveredAlertIds);
  const cockpitUrl = cockpitBaseUrl(opts.projectId);

  let sentNow = 0;
  const newlyDelivered: string[] = [];
  let lastAlertAt = nextCredential.lastAlertAt ?? null;

  for (const alert of pending) {
    const payload = formatSlackAlertBlocks(alert, cockpitUrl);
    await postMessage(nextCredential.botAccessToken, nextCredential.channelId, payload);
    sentNow += 1;
    newlyDelivered.push(alert.id);
    lastAlertAt = new Date().toISOString();
  }

  const alertsSent = (nextCredential.alertsSent ?? 0) + sentNow;
  nextCredential = {
    ...nextCredential,
    alertsSent,
    lastAlertAt,
    deliveredAlertIds: trimDeliveredAlertIds(nextCredential.deliveredAlertIds ?? [], newlyDelivered),
  };

  const syncedAt = new Date().toISOString();

  return {
    stream: buildCommsStreamFromStats({
      alertsSent,
      lastAlertAt,
      syncedAt,
    }),
    accountLabel: nextCredential.channelName
      ? `${nextCredential.channelName} · ${nextCredential.teamName}`
      : nextCredential.teamName,
    syncedAt,
    refreshedCredential: nextCredential,
  };
}

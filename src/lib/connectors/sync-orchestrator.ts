import "server-only";

import { shouldAutoSync } from "@/lib/connectors/auto-sync";
import {
  applyConnectorSyncToProject,
  applyGitHubSyncToProject,
  type ConnectorSyncApiResponse,
} from "@/lib/connectors/integration-client";
import type { ConnectorProvider } from "@/lib/connectors/credentials-store";
import { runBrevoSync } from "@/lib/connectors/brevo/sync-service";
import { runCrispSync } from "@/lib/connectors/crisp/sync-service";
import { runIntercomSync } from "@/lib/connectors/intercom/sync-service";
import { runZendeskSync } from "@/lib/connectors/zendesk/sync-service";
import { runPipedriveSync } from "@/lib/connectors/pipedrive/sync-service";
import { runHubSpotSync } from "@/lib/connectors/hubspot/sync-service";
import { runQontoSync } from "@/lib/connectors/qonto/sync-service";
import { runPennylaneSync } from "@/lib/connectors/pennylane/sync-service";
import { runAbbySync } from "@/lib/connectors/abby/sync-service";
import { runBetterStackSync } from "@/lib/connectors/better-stack/sync-service";
import { runSlackSync } from "@/lib/connectors/slack/sync-service";
import { runGitHubSync } from "@/lib/connectors/github/sync-service";
import { runFreemiusSync } from "@/lib/connectors/freemius/sync-service";
import { runGoogleAdsSync } from "@/lib/connectors/google-ads/sync-service";
import { runLemonSqueezySync } from "@/lib/connectors/lemon-squeezy/sync-service";
import { runLinkedInAdsSync } from "@/lib/connectors/linkedin-ads/sync-service";
import { runMicrosoftAdsSync } from "@/lib/connectors/microsoft-ads/sync-service";
import { runLoopsSync } from "@/lib/connectors/loops/sync-service";
import { runMetaAdsSync } from "@/lib/connectors/meta-ads/sync-service";
import { runPaddleSync } from "@/lib/connectors/paddle/sync-service";
import { runPlausibleSync } from "@/lib/connectors/plausible/sync-service";
import { runFathomSync } from "@/lib/connectors/fathom/sync-service";
import { runMixpanelSync } from "@/lib/connectors/mixpanel/sync-service";
import { runPostHogSync } from "@/lib/connectors/posthog/sync-service";
import { runResendSync } from "@/lib/connectors/resend/sync-service";
import { runGoogleAnalyticsSync } from "@/lib/connectors/google-analytics/sync-service";
import { runStripeSync } from "@/lib/connectors/stripe/sync-service";
import { runTikTokAdsSync } from "@/lib/connectors/tiktok-ads/sync-service";
import { runVercelSync } from "@/lib/connectors/vercel/sync-service";
import { runSentrySync } from "@/lib/connectors/sentry/sync-service";
import type { ConnectorId } from "@/lib/connectors/types";
import type { HostConnection, UserProject } from "@/lib/portfolio";
import { loadUserProjectAsService, syncUserProjectAsService } from "@/lib/portfolio-sync";

const PROVIDER_TO_CONNECTOR: Partial<Record<ConnectorProvider, ConnectorId>> = {
  github: "github",
  vercel: "vercel",
  stripe: "stripe",
  "google-ads": "google-ads",
  "meta-ads": "meta-ads",
  "tiktok-ads": "tiktok-ads",
  "linkedin-ads": "linkedin-ads",
  "microsoft-ads": "microsoft-ads",
  plausible: "plausible",
  fathom: "fathom",
  loops: "loops",
  "lemon-squeezy": "lemon-squeezy",
  brevo: "brevo",
  resend: "resend",
  crisp: "crisp",
  intercom: "intercom",
  zendesk: "zendesk",
  qonto: "qonto",
  pennylane: "pennylane",
  abby: "abby",
  "better-stack": "better-stack",
  paddle: "paddle",
  freemius: "freemius",
  posthog: "posthog",
  mixpanel: "mixpanel",
  "google-analytics": "google-analytics",
  sentry: "sentry",
  slack: "slack",
  hubspot: "hubspot",
  pipedrive: "pipedrive",
};

export type ConnectorSyncRunResult =
  | { status: "synced"; connectorId: ConnectorId }
  | { status: "skipped"; connectorId: ConnectorId; reason: string }
  | { status: "error"; connectorId: ConnectorId; message: string };

type OrchestratorSyncPayload = Omit<ConnectorSyncApiResponse, "connection"> & {
  connection?: HostConnection;
};

async function runProviderSync(
  userId: string,
  projectId: string,
  provider: ConnectorProvider,
): Promise<OrchestratorSyncPayload> {
  switch (provider) {
    case "stripe":
      return runStripeSync(userId, projectId);
    case "google-ads":
      return runGoogleAdsSync(userId, projectId);
    case "meta-ads":
      return runMetaAdsSync(userId, projectId);
    case "tiktok-ads":
      return runTikTokAdsSync(userId, projectId);
    case "linkedin-ads":
      return runLinkedInAdsSync(userId, projectId);
    case "microsoft-ads":
      return runMicrosoftAdsSync(userId, projectId);
    case "plausible":
      return runPlausibleSync(userId, projectId);
    case "fathom":
      return runFathomSync(userId, projectId);
    case "loops":
      return runLoopsSync(userId, projectId);
    case "lemon-squeezy":
      return runLemonSqueezySync(userId, projectId);
    case "brevo":
      return runBrevoSync(userId, projectId);
    case "resend":
      return runResendSync(userId, projectId);
    case "crisp":
      return runCrispSync(userId, projectId);
    case "intercom":
      return runIntercomSync(userId, projectId);
    case "zendesk":
      return runZendeskSync(userId, projectId);
    case "pipedrive":
      return runPipedriveSync(userId, projectId);
    case "hubspot":
      return runHubSpotSync(userId, projectId);
    case "qonto":
      return runQontoSync(userId, projectId);
    case "pennylane":
      return runPennylaneSync(userId, projectId);
    case "abby":
      return runAbbySync(userId, projectId);
    case "better-stack":
      return runBetterStackSync(userId, projectId);
    case "paddle":
      return runPaddleSync(userId, projectId);
    case "freemius":
      return runFreemiusSync(userId, projectId);
    case "posthog":
      return runPostHogSync(userId, projectId);
    case "mixpanel":
      return runMixpanelSync(userId, projectId);
    case "google-analytics":
      return runGoogleAnalyticsSync(userId, projectId);
    case "github":
      return runGitHubSync(userId, projectId);
    case "vercel": {
      const sync = await runVercelSync(userId, projectId);
      return {
        accountLabel: sync.accountLabel,
        snapshots: sync.snapshots,
        stream: sync.stream,
        syncedAt: sync.syncedAt,
        connection: sync.connection,
      };
    }
    case "sentry": {
      const sync = await runSentrySync(userId, projectId);
      return {
        accountLabel: sync.accountLabel,
        snapshots: sync.snapshots,
        stream: sync.stream,
        syncedAt: sync.syncedAt,
        tokenExpiresAt: sync.tokenExpiresAt,
      };
    }
    case "slack":
      return runSlackSync(userId, projectId);
    default:
      throw new Error(`Sync non supportée pour ${provider}`);
  }
}

function applySyncResult(
  project: UserProject,
  connectorId: ConnectorId,
  result: OrchestratorSyncPayload,
): UserProject {
  const integration = project.integrations?.find((i) => i.connectorId === connectorId);
  const accountLabel =
    result.accountLabel ?? integration?.accountLabel ?? connectorId;

  if (connectorId === "github") {
    const { connection, ...githubPayload } = result;
    void connection;
    return applyGitHubSyncToProject(project, githubPayload, "connected");
  }

  const { connection, ...connectorPayload } = result;
  let updated = applyConnectorSyncToProject(
    project,
    connectorId,
    connectorPayload,
    "connected",
    accountLabel,
  );

  if (connectorId === "vercel" && connection) {
    updated = { ...updated, hostConnection: connection };
  }

  return updated;
}

export async function syncConnectorForProject(
  userId: string,
  projectId: string,
  provider: ConnectorProvider,
  opts?: { force?: boolean },
): Promise<ConnectorSyncRunResult> {
  const connectorId = PROVIDER_TO_CONNECTOR[provider];
  if (!connectorId) {
    return { status: "skipped", connectorId: "stripe", reason: `provider unsupported: ${provider}` };
  }

  const project = await loadUserProjectAsService(userId, projectId);
  if (!project) {
    return { status: "skipped", connectorId, reason: "project not found" };
  }

  const integration = project.integrations?.find((i) => i.connectorId === connectorId);
  if (!integration || integration.status !== "connected") {
    return { status: "skipped", connectorId, reason: "integration not connected" };
  }

  if (!shouldAutoSync(integration, opts)) {
    return { status: "skipped", connectorId, reason: "not stale" };
  }

  try {
    const result = await runProviderSync(userId, projectId, provider);
    const updated = applySyncResult(project, connectorId, result);
    await syncUserProjectAsService(userId, updated);
    return { status: "synced", connectorId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "error", connectorId, message };
  }
}

export function providerToConnectorId(provider: ConnectorProvider): ConnectorId | null {
  return PROVIDER_TO_CONNECTOR[provider] ?? null;
}

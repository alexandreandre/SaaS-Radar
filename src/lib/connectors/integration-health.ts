import type { CockpitAlert } from "@/lib/cockpit-alerts";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { getConnector } from "@/lib/connectors/registry";
import type { ConnectorId, Integration } from "@/lib/connectors/types";

const OAUTH_ADS_CONNECTORS: ConnectorId[] = [
  "google-ads",
  "meta-ads",
  "tiktok-ads",
  "linkedin-ads",
  "microsoft-ads",
];
const TOKEN_HEALTH_CONNECTORS: ConnectorId[] = [...OAUTH_ADS_CONNECTORS, "sentry"];
const TOKEN_WARNING_DAYS = 7;
const SENTRY_TOKEN_WARNING_HOURS = 2;
const STALE_SYNC_DAYS = 30;

export type IntegrationHealthStatus = "ok" | "warning" | "critical";

export type IntegrationHealth = {
  status: IntegrationHealthStatus;
  reason?: string;
};

export function isOAuthAdsConnector(connectorId: ConnectorId): boolean {
  return OAUTH_ADS_CONNECTORS.includes(connectorId);
}

function connectorName(connectorId: ConnectorId): string {
  return getConnector(connectorId)?.name ?? connectorId;
}

function daysUntil(iso: string): number {
  const expiresAt = new Date(iso).getTime();
  if (Number.isNaN(expiresAt)) return Number.POSITIVE_INFINITY;
  return Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
}

function daysSince(iso: string): number {
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return 0;
  return Math.floor((Date.now() - at) / (24 * 60 * 60 * 1000));
}

function hoursUntil(iso: string): number {
  const expiresAt = new Date(iso).getTime();
  if (Number.isNaN(expiresAt)) return Number.POSITIVE_INFINITY;
  return Math.ceil((expiresAt - Date.now()) / (60 * 60 * 1000));
}

function tokenExpiryHealth(integration: Integration): IntegrationHealth | null {
  if (!integration.tokenExpiresAt) return null;

  const name = connectorName(integration.connectorId);

  if (integration.connectorId === "sentry") {
    const untilHours = hoursUntil(integration.tokenExpiresAt);
    if (untilHours <= 0) {
      return {
        status: "critical",
        reason: `Token ${name} expiré — reconnectez pour resynchroniser.`,
      };
    }
    if (untilHours <= SENTRY_TOKEN_WARNING_HOURS) {
      return {
        status: "warning",
        reason: `Token ${name} expire bientôt — une resync sera nécessaire.`,
      };
    }
    return null;
  }

  const until = daysUntil(integration.tokenExpiresAt);

  if (until <= 0) {
    return {
      status: "critical",
      reason: `Token ${name} expiré — reconnectez pour resynchroniser.`,
    };
  }

  if (until <= TOKEN_WARNING_DAYS) {
    const date = new Date(integration.tokenExpiresAt).toLocaleDateString("fr-FR");
    return {
      status: "warning",
      reason: `Token ${name} expire le ${date} — reconnectez.`,
    };
  }

  return null;
}

export function getIntegrationHealth(integration: Integration): IntegrationHealth {
  if (!TOKEN_HEALTH_CONNECTORS.includes(integration.connectorId)) return { status: "ok" };
  if (integration.status !== "connected") return { status: "ok" };

  const tokenHealth = tokenExpiryHealth(integration);
  if (tokenHealth) return tokenHealth;

  if (integration.lastError?.trim()) {
    return { status: "warning", reason: integration.lastError.trim() };
  }

  return { status: "ok" };
}

export function integrationNeedsAction(integration: Integration | undefined): boolean {
  if (!integration) return false;
  const health = getIntegrationHealth(integration);
  return health.status === "warning" || health.status === "critical";
}

export function buildIntegrationHealthAlerts(
  integrations: Integration[] = [],
): CockpitAlert[] {
  const alerts: CockpitAlert[] = [];

  for (const integration of integrations) {
    if (!TOKEN_HEALTH_CONNECTORS.includes(integration.connectorId)) continue;
    if (integration.status !== "connected") continue;

    const name = connectorName(integration.connectorId);
    const id = integration.connectorId;

    if (integration.lastError?.trim()) {
      alerts.push({
        id: `integration-error-${id}`,
        severity: "warning",
        message: `${name} : ${integration.lastError.trim()}`,
        actionModule: "integrations",
      });
      continue;
    }

    if (integration.tokenExpiresAt) {
      if (integration.connectorId === "sentry") {
        const untilHours = hoursUntil(integration.tokenExpiresAt);
        if (untilHours <= 0) {
          alerts.push({
            id: `integration-token-${id}`,
            severity: "critical",
            message: `Token ${name} expiré — reconnectez pour resynchroniser.`,
            actionModule: "integrations",
          });
          continue;
        }
        if (untilHours <= SENTRY_TOKEN_WARNING_HOURS) {
          alerts.push({
            id: `integration-token-${id}`,
            severity: "warning",
            message: `Token ${name} expire bientôt — resynchronisez.`,
            actionModule: "integrations",
          });
          continue;
        }
      } else {
        const until = daysUntil(integration.tokenExpiresAt);
        if (until <= 0) {
          alerts.push({
            id: `integration-token-${id}`,
            severity: "critical",
            message: `Token ${name} expiré — reconnectez pour resynchroniser.`,
            actionModule: "integrations",
          });
          continue;
        }
        if (until <= TOKEN_WARNING_DAYS) {
          const date = new Date(integration.tokenExpiresAt).toLocaleDateString("fr-FR");
          alerts.push({
            id: `integration-token-${id}`,
            severity: "warning",
            message: `Token ${name} expire le ${date} — reconnectez.`,
            actionModule: "integrations",
          });
          continue;
        }
      }
    }

    if (integration.lastSyncAt) {
      const stale = daysSince(integration.lastSyncAt);
      if (stale > STALE_SYNC_DAYS) {
        alerts.push({
          id: `integration-stale-${id}`,
          severity: "info",
          message: `Dernière sync ${name} il y a ${stale} jours.`,
          actionModule: "integrations",
        });
      }
    }
  }

  return alerts;
}

export function filterIntegrationHealthAlerts(
  alerts: CockpitAlert[],
  moduleId: CockpitModuleId,
): CockpitAlert[] {
  if (moduleId !== "acquisition" && moduleId !== "integrations") return [];

  return alerts.filter(
    (alert) =>
      alert.id.startsWith("integration-error-") ||
      alert.id.startsWith("integration-token-") ||
      alert.id.startsWith("integration-stale-"),
  );
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildIntegrationHealthAlerts,
  getIntegrationHealth,
  integrationNeedsAction,
  isOAuthAdsConnector,
} from "../src/lib/connectors/integration-health.ts";
import {
  patchIntegrationMeta,
  setIntegrationError,
} from "../src/lib/connectors/integration-client.ts";
import type { Integration, MetricsSnapshot } from "../src/lib/connectors/types.ts";
import type { UserProject } from "../src/lib/portfolio.ts";
import {
  isAccessTokenExpired,
  shouldRefreshAccessToken,
} from "../src/lib/connectors/meta-ads/token-lifecycle.ts";

function makeIntegration(overrides: Partial<Integration> = {}): Integration {
  return {
    connectorId: "meta-ads",
    status: "connected",
    lastSyncAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeProject(integrations: Integration[], metricsHistory: MetricsSnapshot[] = []): UserProject {
  return {
    id: "proj-1",
    opportunitySlug: "test",
    phase: "revenue",
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
    integrations,
    metricsHistory,
    currentMrr: 0,
    milestones: [],
  } as UserProject;
}

describe("integration-health — oauth ads connectors", () => {
  it("targets oauth ads connectors", () => {
    assert.equal(isOAuthAdsConnector("meta-ads"), true);
    assert.equal(isOAuthAdsConnector("google-ads"), true);
    assert.equal(isOAuthAdsConnector("tiktok-ads"), true);
    assert.equal(isOAuthAdsConnector("linkedin-ads"), true);
    assert.equal(isOAuthAdsConnector("microsoft-ads"), true);
    assert.equal(isOAuthAdsConnector("stripe"), false);
  });

  it("flags lastError as warning alert", () => {
    const alerts = buildIntegrationHealthAlerts([
      makeIntegration({ lastError: "Token Meta Ads expiré." }),
    ]);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0]!.id, "integration-error-meta-ads");
    assert.equal(alerts[0]!.severity, "warning");
  });

  it("flags token expiring within 7 days", () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const health = getIntegrationHealth(makeIntegration({ tokenExpiresAt: soon }));
    assert.equal(health.status, "warning");
    assert.match(health.reason ?? "", /expire le/i);
  });

  it("flags expired token as critical", () => {
    const expired = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const health = getIntegrationHealth(makeIntegration({ tokenExpiresAt: expired }));
    assert.equal(health.status, "critical");
    assert.match(health.reason ?? "", /expiré/i);
  });

  it("flags stale sync after 30 days", () => {
    const oldSync = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const alerts = buildIntegrationHealthAlerts([
      makeIntegration({ lastSyncAt: oldSync, tokenExpiresAt: undefined }),
    ]);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0]!.id, "integration-stale-meta-ads");
    assert.equal(alerts[0]!.severity, "info");
  });

  it("ignores disconnected integrations", () => {
    const alerts = buildIntegrationHealthAlerts([
      makeIntegration({ status: "disconnected", lastError: "ignored" }),
    ]);
    assert.equal(alerts.length, 0);
  });

  it("needs action for warning and critical health", () => {
    const expired = new Date(Date.now() - 1000).toISOString();
    assert.equal(integrationNeedsAction(makeIntegration({ tokenExpiresAt: expired })), true);
    assert.equal(integrationNeedsAction(makeIntegration()), false);
  });
});

describe("integration-client — error handling preserves metrics", () => {
  it("setIntegrationError keeps metricsHistory intact", () => {
    const history: MetricsSnapshot[] = [
      {
        date: "2025-01",
        mrr: 0,
        newMrr: 0,
        expansionMrr: 0,
        churnedMrr: 0,
        customers: 0,
        signups: 0,
        trials: 0,
        activeUsers: 0,
        mau: 0,
        dau: 0,
        adSpend: 120,
        impressions: 1000,
        clicks: 50,
        conversions: 3,
        source: "meta-ads",
      },
    ];
    const project = makeProject([makeIntegration()], history);
    const updated = setIntegrationError(project, "meta-ads", "Token expiré");

    assert.equal(updated.metricsHistory?.[0]?.adSpend, 120);
    assert.equal(updated.integrations?.[0]?.lastError, "Token expiré");
    assert.equal(updated.integrations?.[0]?.lastSyncAt, project.integrations?.[0]?.lastSyncAt);
  });

  it("patchIntegrationMeta merges tokenExpiresAt without touching metrics", () => {
    const history: MetricsSnapshot[] = [
      {
        date: "2025-01",
        mrr: 0,
        newMrr: 0,
        expansionMrr: 0,
        churnedMrr: 0,
        customers: 0,
        signups: 0,
        trials: 0,
        activeUsers: 0,
        mau: 0,
        dau: 0,
        adSpend: 80,
        impressions: 500,
        clicks: 20,
        conversions: 1,
        source: "meta-ads",
      },
    ];
    const project = makeProject([makeIntegration()], history);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const updated = patchIntegrationMeta(project, "meta-ads", { tokenExpiresAt: expiresAt });

    assert.equal(updated.metricsHistory?.[0]?.adSpend, 80);
    assert.equal(updated.integrations?.[0]?.tokenExpiresAt, expiresAt);
  });
});

describe("meta-ads token lifecycle", () => {
  it("detects expired tokens", () => {
    const expired = new Date(Date.now() - 60_000).toISOString();
    assert.equal(isAccessTokenExpired(expired), true);
  });

  it("detects refresh window within 7 days", () => {
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(shouldRefreshAccessToken(soon), true);
  });

  it("skips refresh when token is fresh", () => {
    const fresh = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(shouldRefreshAccessToken(fresh), false);
  });
});

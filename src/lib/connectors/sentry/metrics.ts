import "server-only";

import { sentryFetch } from "@/lib/connectors/sentry/client";
import { buildDevStreamFromMetrics, buildAccountLabel } from "@/lib/connectors/sentry/streams";
import {
  computeErrorRateFromCounts,
  countReleasesLast30d,
  crashFreeRateToUptimePct,
  parseCountUniqueIssueFromEvents,
  parseCrashFreeRateFromSessions,
  parseCrashRateFromSessions,
  sumEventStatsSeries,
} from "@/lib/connectors/sentry/streams";
import type { SentryCredential, SentryRelease, SentrySyncMetrics } from "@/lib/connectors/sentry/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

async function fetchOpenIssuesCount(
  credential: SentryCredential,
  projectId: string,
): Promise<number> {
  const org = encodeURIComponent(credential.organizationSlug);
  const params = new URLSearchParams({
    field: "count_unique(issue)",
    query: "is:unresolved",
    project: projectId,
    statsPeriod: "14d",
  });

  try {
    const data = await sentryFetch<unknown>(
      credential,
      `/organizations/${org}/events/?${params.toString()}`,
    );
    const parsed = parseCountUniqueIssueFromEvents(data);
    if (parsed != null) return parsed;
  } catch {
    // Fallback below
  }

  const issuesParams = new URLSearchParams({
    query: "is:unresolved",
    project: projectId,
    limit: "100",
  });
  const issues = await sentryFetch<unknown[]>(
    credential,
    `/organizations/${org}/issues/?${issuesParams.toString()}`,
  );
  return Array.isArray(issues) ? issues.length : 0;
}

async function fetchErrorRate(
  credential: SentryCredential,
  projectId: string,
): Promise<number> {
  const org = encodeURIComponent(credential.organizationSlug);
  const baseParams = {
    project: projectId,
    statsPeriod: "24h",
    interval: "1h",
  };

  try {
    const errorParams = new URLSearchParams({
      ...baseParams,
      yAxis: "count()",
      query: "event.type:error",
    });
    const totalParams = new URLSearchParams({
      ...baseParams,
      yAxis: "count()",
    });

    const [errorStats, totalStats] = await Promise.all([
      sentryFetch<unknown>(credential, `/organizations/${org}/events/stats/?${errorParams}`),
      sentryFetch<unknown>(credential, `/organizations/${org}/events/stats/?${totalParams}`),
    ]);

    const errorCount = sumEventStatsSeries(errorStats);
    const totalCount = sumEventStatsSeries(totalStats);
    if (totalCount > 0) {
      return computeErrorRateFromCounts(errorCount, totalCount);
    }
  } catch {
    // Fallback sessions crash rate
  }

  const sessionParams = new URLSearchParams({
    field: "crash_rate(session)",
    project: projectId,
    statsPeriod: "24h",
    interval: "1h",
  });
  const sessions = await sentryFetch<unknown>(
    credential,
    `/organizations/${org}/sessions/?${sessionParams.toString()}`,
  );
  const crashRate = parseCrashRateFromSessions(sessions);
  if (crashRate != null) {
    const rate = crashRate <= 1 ? crashRate * 100 : crashRate;
    return Math.round(Math.min(100, Math.max(0, rate)) * 10) / 10;
  }

  return 0;
}

async function fetchCrashFreeUptime(
  credential: SentryCredential,
  projectId: string,
): Promise<number> {
  const org = encodeURIComponent(credential.organizationSlug);
  const params = new URLSearchParams({
    field: "crash_free_rate(session)",
    project: projectId,
    statsPeriod: "7d",
    interval: "1d",
  });

  try {
    const data = await sentryFetch<unknown>(
      credential,
      `/organizations/${org}/sessions/?${params.toString()}`,
    );
    const crashFree = parseCrashFreeRateFromSessions(data);
    return crashFreeRateToUptimePct(crashFree);
  } catch {
    return 0;
  }
}

async function fetchDeploysLast30d(
  credential: SentryCredential,
  projectSlug: string,
): Promise<{ count: number; available: boolean }> {
  const org = encodeURIComponent(credential.organizationSlug);
  const slug = encodeURIComponent(projectSlug);
  const releases: SentryRelease[] = [];
  let cursor: string | null = null;
  let pages = 0;

  try {
    while (pages < 5) {
      pages += 1;
      const params = new URLSearchParams({ per_page: "100" });
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(
        `${credential.apiHost.replace(/\/$/, "")}/api/0/projects/${org}/${slug}/releases/?${params}`,
        {
          headers: {
            Authorization: `Bearer ${credential.accessToken}`,
            Accept: "application/json",
          },
        },
      );

      if (res.status === 403) {
        return { count: 0, available: false };
      }

      if (!res.ok) {
        return { count: 0, available: false };
      }

      const batch = (await res.json()) as SentryRelease[];
      releases.push(...batch);

      const link = res.headers.get("Link");
      const next = link?.match(/cursor="([^"]+)"[^>]*;\s*rel="next"/)?.[1];
      if (!next || batch.length === 0) break;
      cursor = next;
    }

    return { count: countReleasesLast30d(releases), available: true };
  } catch {
    return { count: 0, available: false };
  }
}

export async function fetchSentrySyncMetrics(
  credential: SentryCredential,
): Promise<SentrySyncMetrics> {
  if (!credential.sentryProjectId) {
    throw new Error("Projet Sentry non sélectionné");
  }

  const projectId = credential.sentryProjectId;
  const projectSlug = credential.sentryProjectSlug ?? credential.sentryProjectId;

  const [openIssues, errorRate, uptimePct, deploys] = await Promise.all([
    fetchOpenIssuesCount(credential, projectId),
    fetchErrorRate(credential, projectId),
    fetchCrashFreeUptime(credential, projectId),
    fetchDeploysLast30d(credential, projectSlug),
  ]);

  return {
    openIssues,
    errorRate,
    uptimePct,
    deploysLast30d: deploys.count,
    releasesAvailable: deploys.available,
  };
}

export async function fetchSentryConnectorSync(
  credential: SentryCredential,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const metrics = await fetchSentrySyncMetrics(credential);
  const stream = buildDevStreamFromMetrics(metrics);
  const accountLabel = buildAccountLabel(
    credential.organizationSlug,
    credential.projectName,
    credential.sentryProjectSlug,
  );

  return {
    stream,
    accountLabel,
    syncedAt: new Date().toISOString(),
  };
}

import "server-only";

import {
  computeDeploySuccessRate,
  countDeploymentsLast30d,
  parseBillingChargesJsonl,
} from "@/lib/connectors/vercel/streams";
import type {
  VercelDeployMetrics,
  VercelDeployment,
  VercelProjectSummary,
} from "@/lib/connectors/vercel/types";

const VERCEL_API = "https://api.vercel.com";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export class VercelConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "VercelConnectorError";
    this.status = status;
  }
}

type VercelProject = {
  id: string;
  name: string;
  link?: { type?: string; repo?: string };
};

async function vercelFetch<T>(
  token: string,
  path: string,
  teamId?: string,
): Promise<T> {
  const url = new URL(`${VERCEL_API}${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });

  if (res.status === 401) {
    throw new VercelConnectorError(
      "Accès Vercel révoqué — reconnectez votre compte depuis le cockpit",
      401,
    );
  }

  if (res.status === 403) {
    throw new VercelConnectorError(
      "Permissions Vercel insuffisantes — vérifiez les scopes OAuth de l'intégration",
      403,
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new VercelConnectorError(
      `Erreur API Vercel (${res.status}) : ${text.slice(0, 200)}`,
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

export async function listVercelProjects(
  token: string,
  teamId?: string,
): Promise<VercelProjectSummary[]> {
  const data = await vercelFetch<{ projects: VercelProject[] }>(
    token,
    "/v9/projects?limit=50",
    teamId,
  );
  return (data.projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    repo: p.link?.repo,
  }));
}

export async function fetchProjectDeployments(
  token: string,
  projectId: string,
  teamId?: string,
  sinceMs?: number,
): Promise<VercelDeployment[]> {
  const since = sinceMs ?? Date.now() - THIRTY_DAYS_MS;
  const all: VercelDeployment[] = [];
  let until: number | undefined;

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({
      projectId,
      since: String(since),
      limit: "100",
    });
    if (until) params.set("until", String(until));

    const data = await vercelFetch<{ deployments: VercelDeployment[] }>(
      token,
      `/v6/deployments?${params.toString()}`,
      teamId,
    );
    const batch = data.deployments ?? [];
    if (batch.length === 0) break;

    all.push(...batch);
    if (batch.length < 100) break;

    const oldest = batch.at(-1)?.createdAt;
    if (!oldest || oldest <= since) break;
    until = oldest - 1;
  }

  return all;
}

export async function fetchLatestDeployment(
  token: string,
  projectId: string,
  teamId?: string,
): Promise<VercelDeployment | null> {
  const data = await vercelFetch<{ deployments: VercelDeployment[] }>(
    token,
    `/v6/deployments?projectId=${encodeURIComponent(projectId)}&target=production&limit=1`,
    teamId,
  );
  const production = data.deployments?.[0];
  if (production) return production;

  const fallback = await vercelFetch<{ deployments: VercelDeployment[] }>(
    token,
    `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=1`,
    teamId,
  );
  return fallback.deployments?.[0] ?? null;
}

export async function fetchMonthlyInfraCost(
  token: string,
  teamId: string | undefined,
  projectId: string,
): Promise<{ cost: number; billingAvailable: boolean }> {
  if (!teamId) return { cost: 0, billingAvailable: false };

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = now.toISOString();

  const url = new URL(`${VERCEL_API}/v1/billing/charges`);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/x-ndjson, application/json",
    },
    next: { revalidate: 0 },
  });

  if (res.status === 403 || res.status === 404) {
    return { cost: 0, billingAvailable: false };
  }

  if (res.status === 401 || !res.ok) {
    return { cost: 0, billingAvailable: false };
  }

  const text = await res.text();
  return {
    cost: parseBillingChargesJsonl(text, projectId),
    billingAvailable: true,
  };
}

export async function fetchVercelDeployMetrics(
  token: string,
  projectId: string,
  teamId?: string,
): Promise<VercelDeployMetrics | null> {
  const projects = await listVercelProjects(token, teamId);
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  const deployment = await fetchLatestDeployment(token, projectId, teamId);
  const state = deployment?.readyState ?? deployment?.state ?? "UNKNOWN";
  const productionUrl = deployment?.url ? `https://${deployment.url}` : "";
  const lastDeploymentAt = deployment?.createdAt
    ? new Date(deployment.createdAt).toISOString()
    : null;

  const history = await fetchProjectDeployments(token, projectId, teamId);
  const deploysLast30d = countDeploymentsLast30d(history);
  const uptimePct = computeDeploySuccessRate(history);

  let infraCostMonthly = 0;
  let billingAvailable = false;
  try {
    const billing = await fetchMonthlyInfraCost(token, teamId, projectId);
    infraCostMonthly = billing.cost;
    billingAvailable = billing.billingAvailable;
  } catch {
    infraCostMonthly = 0;
    billingAvailable = false;
  }

  return {
    projectId,
    projectName: project.name,
    productionUrl,
    lastDeploymentState: state,
    lastDeploymentAt,
    deploysLast30d,
    uptimePct,
    infraCostMonthly,
    billingAvailable,
  };
}

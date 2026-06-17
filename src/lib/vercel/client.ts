import "server-only";

const VERCEL_API = "https://api.vercel.com";

export function isVercelOAuthConfigured(): boolean {
  return Boolean(
    process.env.VERCEL_CLIENT_ID &&
      process.env.VERCEL_CLIENT_SECRET &&
      process.env.VERCEL_REDIRECT_URI,
  );
}

export function getVercelAuthorizeUrl(state: string): string | null {
  const clientId = process.env.VERCEL_CLIENT_ID;
  const redirectUri = process.env.VERCEL_REDIRECT_URI;
  if (!clientId || !redirectUri) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read_user read_projects read_deployments",
    state,
  });
  return `https://vercel.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeVercelCode(code: string): Promise<{
  accessToken: string;
  teamId?: string;
  userId?: string;
}> {
  const clientId = process.env.VERCEL_CLIENT_ID;
  const clientSecret = process.env.VERCEL_CLIENT_SECRET;
  const redirectUri = process.env.VERCEL_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("OAuth Vercel non configuré");
  }

  const res = await fetch(`${VERCEL_API}/v2/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel OAuth error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    team_id?: string;
    user_id?: string;
  };

  return {
    accessToken: data.access_token,
    teamId: data.team_id,
    userId: data.user_id,
  };
}

type VercelProject = {
  id: string;
  name: string;
  link?: { type?: string; repo?: string };
};

type VercelDeployment = {
  uid: string;
  url: string;
  state: string;
  readyState?: string;
  createdAt: number;
};

async function vercelFetch<T>(
  token: string,
  path: string,
  teamId?: string,
): Promise<T | null> {
  const url = new URL(`${VERCEL_API}${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function listVercelProjects(
  token: string,
  teamId?: string,
): Promise<VercelProject[]> {
  const data = await vercelFetch<{ projects: VercelProject[] }>(
    token,
    "/v9/projects?limit=50",
    teamId,
  );
  return data?.projects ?? [];
}

export async function fetchLatestDeployment(
  token: string,
  projectId: string,
  teamId?: string,
): Promise<VercelDeployment | null> {
  const data = await vercelFetch<{ deployments: VercelDeployment[] }>(
    token,
    `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=1`,
    teamId,
  );
  return data?.deployments?.[0] ?? null;
}

export type VercelDeployMetrics = {
  projectId: string;
  projectName: string;
  productionUrl: string;
  lastDeploymentState: string;
  deploysLast30d: number;
  uptimePct: number;
};

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

  const history = await vercelFetch<{ deployments: VercelDeployment[] }>(
    token,
    `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=30`,
    teamId,
  );
  const deploysLast30d = history?.deployments?.length ?? 0;
  const failed = (history?.deployments ?? []).filter(
    (d) => (d.readyState ?? d.state)?.toUpperCase() === "ERROR",
  ).length;
  const uptimePct =
    deploysLast30d > 0
      ? Math.round(((deploysLast30d - failed) / deploysLast30d) * 1000) / 10
      : 99.9;

  return {
    projectId,
    projectName: project.name,
    productionUrl,
    lastDeploymentState: state,
    deploysLast30d,
    uptimePct,
  };
}

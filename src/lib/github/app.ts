import "server-only";

import { createSign } from "crypto";

const GITHUB_API = "https://api.github.com";

function getAppId(): string | null {
  return process.env.GITHUB_APP_ID ?? null;
}

function getPrivateKey(): string | null {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!raw) return null;
  return raw.includes("BEGIN") ? raw.replace(/\\n/g, "\n") : Buffer.from(raw, "base64").toString("utf8");
}

export function isGitHubAppConfigured(): boolean {
  return Boolean(getAppId() && getPrivateKey());
}

function createAppJwt(): string {
  const appId = getAppId();
  const privateKey = getPrivateKey();
  if (!appId || !privateKey) throw new Error("GitHub App non configurée");

  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now - 60, exp: now + 600, iss: appId };
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = `${header}.${body}`;
  const sign = createSign("RSA-SHA256");
  sign.update(data);
  sign.end();
  const signature = sign.sign(privateKey, "base64url");
  return `${data}.${signature}`;
}

export async function getInstallationAccessToken(
  installationId: number,
): Promise<string> {
  const jwt = createAppJwt();
  const res = await fetch(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub token error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

export function getGitHubInstallUrl(state: string): string | null {
  const slug = process.env.GITHUB_APP_SLUG;
  if (!slug) return null;
  return `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`;
}

async function ghFetch<T>(token: string, path: string): Promise<T | null> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 0 },
  });
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export type GitHubRepoMetrics = {
  repoFullName: string;
  stars: number;
  openIssues: number;
  openPrs: number;
  commitsLast7d: number;
  commitsPrev7d: number;
  lastWorkflowConclusion: string | null;
  deploysLast30d: number;
  viewsLast14d: number;
  defaultBranch: string;
  lastPushAt: string | null;
  language: string | null;
};

export async function fetchRepoMetrics(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubRepoMetrics> {
  const repoFullName = `${owner}/${repo}`;

  const [repoData, pulls, participation, workflowRuns, views] = await Promise.all([
    ghFetch<{
      stargazers_count: number;
      open_issues_count: number;
      default_branch: string;
      pushed_at: string;
      language: string | null;
    }>(token, `/repos/${owner}/${repo}`),
    ghFetch<{ number: number }[]>(token, `/repos/${owner}/${repo}/pulls?state=open&per_page=30`),
    ghFetch<{ all: number[]; owner: number[] }>(
      token,
      `/repos/${owner}/${repo}/stats/participation`,
    ),
    ghFetch<{ workflow_runs: { conclusion: string | null; created_at: string }[] }>(
      token,
      `/repos/${owner}/${repo}/actions/runs?per_page=5`,
    ),
    ghFetch<{ count: number }[]>(token, `/repos/${owner}/${repo}/traffic/views`),
  ]);

  const allWeeks = participation?.all ?? [];
  const commitsLast7d = allWeeks.slice(-1).reduce((s, w) => s + w, 0);
  const commitsPrev7d = allWeeks.slice(-2, -1).reduce((s, w) => s + w, 0);

  const runs = workflowRuns?.workflow_runs ?? [];
  const successRuns = runs.filter((r) => r.conclusion === "success").length;

  const viewsTotal = (views ?? []).reduce((s, v) => s + (v.count ?? 0), 0);

  return {
    repoFullName,
    stars: repoData?.stargazers_count ?? 0,
    openIssues: repoData?.open_issues_count ?? 0,
    openPrs: Array.isArray(pulls) ? pulls.length : 0,
    commitsLast7d,
    commitsPrev7d,
    lastWorkflowConclusion: runs[0]?.conclusion ?? null,
    deploysLast30d: successRuns,
    viewsLast14d: viewsTotal,
    defaultBranch: repoData?.default_branch ?? "main",
    lastPushAt: repoData?.pushed_at ?? null,
    language: repoData?.language ?? null,
  };
}

export async function listInstallationRepos(
  token: string,
): Promise<{ fullName: string; private: boolean }[]> {
  const data = await ghFetch<{
    repositories: { full_name: string; private: boolean }[];
  }>(token, "/installation/repositories?per_page=100");
  return (data?.repositories ?? []).map((r) => ({
    fullName: r.full_name,
    private: r.private,
  }));
}

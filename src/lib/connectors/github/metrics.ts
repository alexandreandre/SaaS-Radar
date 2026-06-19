import {
  MANIFEST_CANDIDATES,
  REPO_LOGO_CANDIDATES,
  parseManifestIcons,
} from "@/lib/build/product-logo";
import {
  ghFetch,
  ghFetchPaginated,
  GitHubConnectorError,
} from "@/lib/connectors/github/client";
import { countDeploysLast30d } from "@/lib/connectors/github/streams";
import type { GitHubRepoMetrics, GitHubRepoSummary } from "@/lib/connectors/github/types";

type GitHubContentFile = {
  type?: string;
  download_url?: string;
  content?: string;
  encoding?: string;
};

async function fetchRepoFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<GitHubContentFile | null> {
  return ghFetch<GitHubContentFile>(
    token,
    `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
  );
}

function decodeGitHubContent(file: GitHubContentFile): string | null {
  if (!file.content || file.encoding !== "base64") return null;
  try {
    return Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
  } catch {
    return null;
  }
}

async function fetchWorkflowRunsLast30d(
  token: string,
  owner: string,
  repo: string,
): Promise<{ runs: { conclusion: string | null; created_at: string }[]; lastConclusion: string | null }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const runs = await ghFetchPaginated<{ conclusion: string | null; created_at: string }>(
    token,
    `/repos/${owner}/${repo}/actions/runs`,
  );

  const recentRuns = runs.filter((run) => new Date(run.created_at) >= cutoff);
  return {
    runs: recentRuns,
    lastConclusion: runs[0]?.conclusion ?? null,
  };
}

export async function fetchRepoMetrics(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubRepoMetrics> {
  const repoFullName = `${owner}/${repo}`;

  const [repoData, pulls, participation, workflowData, views] = await Promise.all([
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
      { allow202: true },
    ),
    fetchWorkflowRunsLast30d(token, owner, repo),
    ghFetch<{ count: number }[]>(token, `/repos/${owner}/${repo}/traffic/views`),
  ]);

  if (!repoData) {
    throw new GitHubConnectorError(
      `Dépôt ${repoFullName} inaccessible — vérifiez l'installation GitHub App.`,
      404,
    );
  }

  const allWeeks = participation?.all ?? [];
  const commitsLast7d = allWeeks.slice(-1).reduce((s, w) => s + w, 0);
  const commitsPrev7d = allWeeks.slice(-2, -1).reduce((s, w) => s + w, 0);
  const viewsTotal = (views ?? []).reduce((s, v) => s + (v.count ?? 0), 0);

  return {
    repoFullName,
    stars: repoData.stargazers_count ?? 0,
    openIssues: repoData.open_issues_count ?? 0,
    openPrs: Array.isArray(pulls) ? pulls.length : 0,
    commitsLast7d,
    commitsPrev7d,
    lastWorkflowConclusion: workflowData.lastConclusion,
    deploysLast30d: countDeploysLast30d(workflowData.runs),
    viewsLast14d: viewsTotal,
    defaultBranch: repoData.default_branch ?? "main",
    lastPushAt: repoData.pushed_at ?? null,
    language: repoData.language ?? null,
  };
}

export async function listInstallationRepos(token: string): Promise<GitHubRepoSummary[]> {
  const data = await ghFetch<{
    repositories: { full_name: string; private: boolean }[];
  }>(token, "/installation/repositories?per_page=100");
  return (data?.repositories ?? []).map((r) => ({
    fullName: r.full_name,
    private: r.private,
  }));
}

export async function detectRepoLogo(
  token: string,
  owner: string,
  repo: string,
  defaultBranch: string,
): Promise<string | null> {
  const ref = defaultBranch || "main";

  for (const path of REPO_LOGO_CANDIDATES) {
    const file = await fetchRepoFile(token, owner, repo, path, ref);
    if (file?.type === "file" && file.download_url) {
      return file.download_url;
    }
  }

  for (const manifestPath of MANIFEST_CANDIDATES) {
    const file = await fetchRepoFile(token, owner, repo, manifestPath, ref);
    if (file?.type !== "file") continue;
    const raw = decodeGitHubContent(file);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const manifestDir = manifestPath.includes("/")
        ? manifestPath.slice(0, manifestPath.lastIndexOf("/") + 1)
        : "";
      const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${manifestDir}`;
      const iconUrl = parseManifestIcons(parsed, rawBase);
      if (iconUrl) return iconUrl;
    } catch {
      continue;
    }
  }

  return null;
}

export async function assertRepoInInstallation(
  token: string,
  repoFullName: string,
): Promise<void> {
  const repos = await listInstallationRepos(token);
  if (!repos.some((r) => r.fullName === repoFullName)) {
    throw new GitHubConnectorError(
      `Le dépôt ${repoFullName} n'est pas accessible via l'installation GitHub — réinstallez l'app sur ce dépôt.`,
      403,
    );
  }
}

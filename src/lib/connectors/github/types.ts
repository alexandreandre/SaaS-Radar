import type { BuildToolId } from "@/lib/build/tools";

export const GITHUB_MAX_TRACKED_REPOS = 5;

export type GitHubTrackedRepoRef = {
  repoFullName: string;
  linkedToolId?: BuildToolId;
  isPrimary?: boolean;
  addedAt: string;
};

/** Legacy shape: { installationId, repoFullName? } */
export type LegacyGitHubCredential = {
  installationId: number;
  repoFullName?: string;
  trackedRepos?: GitHubTrackedRepoRef[];
};

export type GitHubCredential = {
  installationId: number;
  trackedRepos: GitHubTrackedRepoRef[];
};

export type GitHubRepoSummary = {
  fullName: string;
  private: boolean;
};

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

export type GitHubWorkflowRun = {
  conclusion: string | null;
  created_at: string;
};

export type AddGitHubRepoOptions = {
  linkedToolId?: BuildToolId;
  setPrimary?: boolean;
};

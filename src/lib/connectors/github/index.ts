export type {
  GitHubCredential,
  GitHubRepoMetrics,
  GitHubRepoSummary,
  GitHubTrackedRepoRef,
  AddGitHubRepoOptions,
  GITHUB_MAX_TRACKED_REPOS,
} from "./types";
export { GitHubConnectorError, getGitHubInstallUrl, getInstallationAccessToken, isGitHubAppConfigured } from "./client";
export { fetchRepoMetrics, listInstallationRepos, detectRepoLogo } from "./metrics";
export {
  countDeploysLast30d,
  metricsToDevStream,
  parseRepoFullName,
} from "./streams";
export {
  aggregateGitHubAccountLabel,
  assertCanAddGitHubRepo,
  buildGitHubMultiStreamFromSync,
  canAddGitHubRepo,
  getGitHubRepoFullNamesForMatch,
  getGitHubReposForTool,
  getOtherGitHubRepos,
  getPrimaryGitHubRepo,
  hasGitHubTrackedRepos,
  resolveGitHubTrackedRepos,
  mergeProjectTrackedRepos,
  normalizeGitHubCredential,
  normalizeProjectGitHub,
  removeRepoFromGitHubMultiStream,
  removeTrackedRepoRef,
  setPrimaryTrackedRepoRef,
  trackedRefsToProjectRepos,
  upsertTrackedRepoRef,
} from "./normalize";
export {
  addGitHubTrackedRepo,
  disconnectGitHub,
  listGitHubReposForProject,
  loadGitHubCredential,
  removeGitHubTrackedRepo,
  runGitHubSync,
  saveGitHubCredentialWithRepo,
  saveGitHubInstallation,
  setGitHubRepoToolLink,
  setPrimaryGitHubRepo,
  unlinkGitHubRepoTool,
  type GitHubSyncPayload,
} from "./sync-service";

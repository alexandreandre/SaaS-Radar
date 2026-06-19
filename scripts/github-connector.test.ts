import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countDeploysLast30d,
  metricsToDevStream,
  parseRepoFullName,
} from "../src/lib/connectors/github/streams.ts";
import {
  aggregateGitHubAccountLabel,
  assertCanAddGitHubRepo,
  canAddGitHubRepo,
  getGitHubReposForTool,
  normalizeGitHubCredential,
  normalizeProjectGitHub,
} from "../src/lib/connectors/github/normalize.ts";
import { GITHUB_MAX_TRACKED_REPOS } from "../src/lib/connectors/github/types.ts";
import {
  mergeGitHubMultiStream,
  normalizeGitHubStreamPayload,
} from "../src/lib/connectors/streams.ts";
import type { GitHubRepoMetrics } from "../src/lib/connectors/github/types.ts";
import type { UserProject } from "../src/lib/portfolio.ts";

function baseMetrics(overrides: Partial<GitHubRepoMetrics> = {}): GitHubRepoMetrics {
  return {
    repoFullName: "owner/repo",
    stars: 10,
    openIssues: 3,
    openPrs: 1,
    commitsLast7d: 5,
    commitsPrev7d: 2,
    lastWorkflowConclusion: "success",
    deploysLast30d: 4,
    viewsLast14d: 100,
    defaultBranch: "main",
    lastPushAt: "2026-06-01T12:00:00Z",
    language: "TypeScript",
    ...overrides,
  };
}

describe("github connector — repo parsing", () => {
  it("accepts owner/repo format", () => {
    assert.deepEqual(parseRepoFullName("acme/saas-radar"), { owner: "acme", repo: "saas-radar" });
  });

  it("rejects invalid format", () => {
    assert.equal(parseRepoFullName("invalid"), null);
    assert.equal(parseRepoFullName("/repo"), null);
    assert.equal(parseRepoFullName("owner/"), null);
  });
});

describe("github connector — deploysLast30d", () => {
  const now = new Date("2026-06-18T12:00:00Z");

  it("counts only successful runs within 30 days", () => {
    const count = countDeploysLast30d(
      [
        { conclusion: "success", created_at: "2026-06-10T10:00:00Z" },
        { conclusion: "success", created_at: "2026-05-20T10:00:00Z" },
        { conclusion: "failure", created_at: "2026-06-12T10:00:00Z" },
        { conclusion: "success", created_at: "2026-04-01T10:00:00Z" },
      ],
      now,
    );
    assert.equal(count, 2);
  });
});

describe("github connector — metricsToDevStream", () => {
  it("maps workflow success to healthy stream", () => {
    const stream = metricsToDevStream(baseMetrics());
    assert.equal(stream.type, "dev");
    assert.equal(stream.commitsLast7d, 5);
    assert.equal(stream.commitsDelta, 3);
    assert.equal(stream.deploysLast30d, 4);
    assert.equal(stream.lastWorkflowConclusion, "success");
    assert.equal(stream.healthScore, 95);
    assert.equal(stream.errorRate, 0);
  });

  it("penalizes failed workflow and zero commits", () => {
    const stream = metricsToDevStream(
      baseMetrics({ lastWorkflowConclusion: "failure", commitsLast7d: 0, commitsPrev7d: 0 }),
    );
    assert.equal(stream.healthScore, 25);
    assert.equal(stream.errorRate, 2.5);
    assert.equal(stream.uptimePct, 98);
  });

  it("clamps healthScore between 0 and 100", () => {
    const low = metricsToDevStream(
      baseMetrics({ lastWorkflowConclusion: "failure", commitsLast7d: 0, commitsPrev7d: 10 }),
    );
    assert.equal(low.healthScore, 25);

    const high = metricsToDevStream(
      baseMetrics({ commitsLast7d: 20, commitsPrev7d: 0, lastWorkflowConclusion: "success" }),
    );
    assert.equal(high.healthScore, 95);
  });
});

describe("github connector — multi-repo normalize", () => {
  it("migrates legacy credential to trackedRepos", () => {
    const cred = normalizeGitHubCredential({
      installationId: 42,
      repoFullName: "acme/legacy",
    });
    assert.equal(cred.trackedRepos.length, 1);
    assert.equal(cred.trackedRepos[0]!.repoFullName, "acme/legacy");
    assert.equal(cred.trackedRepos[0]!.isPrimary, true);
  });

  it("wraps legacy DevStream into GitHubMultiStream", () => {
    const legacy = metricsToDevStream(baseMetrics({ repoFullName: "acme/old" }));
    const multi = normalizeGitHubStreamPayload(legacy);
    assert.equal(multi?.type, "github");
    assert.equal(multi?.primaryRepoFullName, "acme/old");
    assert.ok(multi?.repos["acme/old"]);
  });

  it("mergeGitHubMultiStream adds repo without overwriting others", () => {
    const first = metricsToDevStream(baseMetrics({ repoFullName: "acme/a" }));
    let multi = mergeGitHubMultiStream(undefined, "acme/a", first);
    const second = metricsToDevStream(baseMetrics({ repoFullName: "acme/b", commitsLast7d: 9 }));
    multi = mergeGitHubMultiStream(multi, "acme/b", second);
    assert.equal(Object.keys(multi.repos).length, 2);
    assert.equal(multi.repos["acme/a"]!.commitsLast7d, 5);
    assert.equal(multi.repos["acme/b"]!.commitsLast7d, 9);
  });

  it("rejects duplicate tracked repo", () => {
    const refs = [{ repoFullName: "acme/a", addedAt: "2026-01-01T00:00:00Z" }];
    assert.throws(() => assertCanAddGitHubRepo(refs, "acme/a"), /déjà suivi/);
  });

  it("rejects 6th tracked repo", () => {
    const refs = Array.from({ length: GITHUB_MAX_TRACKED_REPOS }, (_, i) => ({
      repoFullName: `acme/repo-${i}`,
      addedAt: "2026-01-01T00:00:00Z",
    }));
    assert.equal(canAddGitHubRepo(refs), false);
    assert.throws(() => assertCanAddGitHubRepo(refs, "acme/extra"), /Limite/);
  });

  it("filters repos by linkedToolId", () => {
    const project: UserProject = {
      id: "p1",
      opportunityId: "o1",
      name: "Test",
      phase: "build",
      createdAt: "2026-01-01",
      githubTrackedRepos: [
        {
          repoFullName: "acme/cursor-app",
          installationId: 1,
          connectedAt: "2026-01-01",
          linkedToolId: "cursor",
        },
        {
          repoFullName: "acme/lovable-export",
          installationId: 1,
          connectedAt: "2026-01-02",
          linkedToolId: "lovable",
        },
      ],
    };
    const cursorRepos = getGitHubReposForTool(project, "cursor");
    assert.equal(cursorRepos.length, 1);
    assert.equal(cursorRepos[0]!.repoFullName, "acme/cursor-app");
  });

  it("aggregates account label for multiple repos", () => {
    assert.equal(
      aggregateGitHubAccountLabel([
        { repoFullName: "acme/main", isPrimary: true, addedAt: "2026-01-01" },
        { repoFullName: "acme/api", addedAt: "2026-01-02" },
        { repoFullName: "acme/web", addedAt: "2026-01-03" },
      ]),
      "acme/main (+2)",
    );
    assert.equal(
      aggregateGitHubAccountLabel([{ repoFullName: "solo/repo", addedAt: "2026-01-01" }]),
      "solo/repo",
    );
  });

  it("migrates project githubConnection to githubTrackedRepos", () => {
    const project: UserProject = {
      id: "p1",
      opportunityId: "o1",
      name: "Legacy",
      phase: "build",
      createdAt: "2026-01-01",
      githubConnection: {
        installationId: 9,
        repoFullName: "acme/legacy",
        connectedAt: "2026-01-01",
      },
    };
    const migrated = normalizeProjectGitHub(project);
    assert.equal(migrated.githubConnection, undefined);
    assert.equal(migrated.githubTrackedRepos?.[0]?.repoFullName, "acme/legacy");
    assert.equal(migrated.githubTrackedRepos?.[0]?.isPrimary, true);
  });
});

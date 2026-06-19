import type { VercelProjectSummary } from "@/lib/connectors/vercel/types";

export type VercelProjectResolution =
  | { kind: "auto"; projectId: string; projectName: string }
  | { kind: "choose" }
  | { kind: "none" };

function normalizeRepo(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRepoList(
  githubRepoFullNames?: string | string[] | null,
): string[] {
  if (!githubRepoFullNames) return [];
  if (Array.isArray(githubRepoFullNames)) {
    return githubRepoFullNames.map((r) => r.trim()).filter(Boolean);
  }
  const single = githubRepoFullNames.trim();
  return single ? [single] : [];
}

function matchProjectByRepo(
  projects: VercelProjectSummary[],
  githubRepo: string,
): VercelProjectSummary | null {
  const target = normalizeRepo(githubRepo);
  const matches = projects.filter((project) => {
    if (!project.repo) return false;
    return normalizeRepo(project.repo) === target;
  });
  return matches.length === 1 ? matches[0]! : null;
}

export function resolveVercelProjectAfterOAuth(
  projects: VercelProjectSummary[],
  githubRepoFullNames?: string | string[] | null,
): VercelProjectResolution {
  if (projects.length === 0) return { kind: "none" };
  if (projects.length === 1) {
    return {
      kind: "auto",
      projectId: projects[0]!.id,
      projectName: projects[0]!.name,
    };
  }

  for (const githubRepo of normalizeRepoList(githubRepoFullNames)) {
    const match = matchProjectByRepo(projects, githubRepo);
    if (match) {
      return {
        kind: "auto",
        projectId: match.id,
        projectName: match.name,
      };
    }
  }

  return { kind: "choose" };
}

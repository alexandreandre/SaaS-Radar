import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { listVercelProjects } from "@/lib/connectors/vercel/client";
import { exchangeVercelCode } from "@/lib/connectors/vercel/oauth";
import { resolveVercelProjectAfterOAuth } from "@/lib/connectors/vercel/resolve";
import { fetchVercelConnectorSync } from "@/lib/connectors/vercel/metrics";
import { loadUserProject } from "@/lib/portfolio-sync";
import { getGitHubRepoFullNamesForMatch } from "@/lib/connectors/github/normalize";
import { isVercelConfigured } from "@/lib/connectors/vercel/oauth";
import type { VercelCredential } from "@/lib/connectors/vercel/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadVercelCredential(
  userId: string,
  projectId: string,
): Promise<VercelCredential | null> {
  const stored = await loadConnectorCredential<VercelCredential>(userId, projectId, "vercel");
  return stored?.data ?? null;
}

export async function saveVercelOAuthCredential(
  userId: string,
  projectId: string,
  tokens: { accessToken: string; teamId?: string; userId?: string },
): Promise<void> {
  const existing = await loadVercelCredential(userId, projectId);
  const credential: VercelCredential = {
    accessToken: tokens.accessToken,
    teamId: tokens.teamId ?? existing?.teamId ?? null,
    userId: tokens.userId ?? existing?.userId ?? null,
    vercelProjectId: existing?.vercelProjectId ?? null,
    projectName: existing?.projectName ?? null,
  };

  await saveConnectorCredential(userId, projectId, "vercel", credential, {
    oauthConnected: true,
    teamId: credential.teamId,
    vercelProjectId: credential.vercelProjectId,
    accountLabel: credential.projectName ?? "Vercel",
  });
}

export async function exchangeAndStoreVercelOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<void> {
  const tokens = await exchangeVercelCode(code);
  await saveVercelOAuthCredential(userId, projectId, tokens);
}

export async function listVercelProjectsForUser(
  userId: string,
  projectId: string,
): Promise<{ id: string; name: string; repo?: string }[]> {
  const credential = await loadVercelCredential(userId, projectId);
  if (!credential?.accessToken) {
    throw new Error("Vercel non connecté pour ce projet");
  }

  return listVercelProjects(credential.accessToken, credential.teamId ?? undefined);
}

export async function runVercelSync(
  userId: string,
  projectId: string,
  vercelProjectId?: string,
): Promise<
  ConnectorSyncResult & {
    accountLabel: string;
    connection: Awaited<ReturnType<typeof fetchVercelConnectorSync>>["connection"];
    billingAvailable: boolean;
  }
> {
  const credential = await loadVercelCredential(userId, projectId);
  if (!credential?.accessToken) {
    throw new Error("Vercel non connecté pour ce projet");
  }

  const targetProjectId = vercelProjectId?.trim() || credential.vercelProjectId?.trim();
  if (!targetProjectId) {
    throw new Error("Sélectionnez un projet Vercel à synchroniser");
  }

  const result = await fetchVercelConnectorSync(credential, targetProjectId);

  await saveConnectorCredential(userId, projectId, "vercel", result.updatedCredential, {
    oauthConnected: true,
    teamId: result.updatedCredential.teamId,
    vercelProjectId: result.updatedCredential.vercelProjectId,
    accountLabel: result.accountLabel,
    billingAvailable: result.billingAvailable,
  });

  return {
    stream: result.stream,
    accountLabel: result.accountLabel,
    connection: result.connection,
    syncedAt: result.syncedAt,
    billingAvailable: result.billingAvailable,
  };
}

export async function disconnectVercel(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "vercel");
}

export async function tryAutoConnectVercelAfterOAuth(
  userId: string,
  projectId: string,
): Promise<
  | ({
      kind: "connected";
    } & ConnectorSyncResult & {
        accountLabel: string;
        connection: Awaited<ReturnType<typeof fetchVercelConnectorSync>>["connection"];
      })
  | { kind: "choose" }
  | { kind: "none" }
> {
  const projects = await listVercelProjectsForUser(userId, projectId);
  const saasProject = await loadUserProject(userId, projectId);
  const githubRepoNames = saasProject ? getGitHubRepoFullNamesForMatch(saasProject) : [];
  const resolution = resolveVercelProjectAfterOAuth(projects, githubRepoNames);

  if (resolution.kind === "none") return { kind: "none" };
  if (resolution.kind === "choose") return { kind: "choose" };

  const sync = await runVercelSync(userId, projectId, resolution.projectId);
  return { kind: "connected", ...sync };
}

export async function getVercelConnectorStatus(userId: string, projectId: string) {
  const credential = await loadVercelCredential(userId, projectId);
  const stored = await loadConnectorCredential(userId, projectId, "vercel");
  const metadata = (stored?.metadata ?? {}) as Record<string, unknown>;

  return {
    platformConfigured: isVercelConfigured(),
    oauthConnected: Boolean(credential?.accessToken),
    vercelProjectId: credential?.vercelProjectId ?? null,
    accountLabel: credential?.projectName ?? null,
    billingAvailable: metadata.billingAvailable === true,
  };
}

import "server-only";

import { fetchVercelDeployMetrics } from "@/lib/connectors/vercel/client";
import { buildDevStreamFromMetrics } from "@/lib/connectors/vercel/streams";
import type { VercelCredential, VercelSyncConnection } from "@/lib/connectors/vercel/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function fetchVercelConnectorSync(
  credential: VercelCredential,
  vercelProjectId: string,
): Promise<
  ConnectorSyncResult & {
    accountLabel: string;
    connection: VercelSyncConnection;
    updatedCredential: VercelCredential;
    billingAvailable: boolean;
  }
> {
  const teamId = credential.teamId ?? undefined;
  const metrics = await fetchVercelDeployMetrics(
    credential.accessToken,
    vercelProjectId,
    teamId,
  );

  if (!metrics) {
    throw new Error("Projet Vercel introuvable");
  }

  const stream = buildDevStreamFromMetrics(metrics);
  const syncedAt = new Date().toISOString();

  const connection: VercelSyncConnection = {
    provider: "vercel",
    projectId: metrics.projectId,
    projectName: metrics.projectName,
    productionUrl: metrics.productionUrl || undefined,
    connectedAt: syncedAt,
  };

  const updatedCredential: VercelCredential = {
    ...credential,
    vercelProjectId: metrics.projectId,
    projectName: metrics.projectName,
  };

  return {
    stream,
    accountLabel: metrics.projectName,
    connection,
    updatedCredential,
    syncedAt,
    billingAvailable: metrics.billingAvailable,
  };
}

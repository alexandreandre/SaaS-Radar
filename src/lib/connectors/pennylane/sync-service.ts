import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  ensureFreshAccessToken,
  validateCredential,
} from "@/lib/connectors/pennylane/client";
import {
  buildAccessTokenExpiry,
  exchangePennylaneCode,
  revokePennylaneToken,
} from "@/lib/connectors/pennylane/oauth";
import { fetchPennylaneConnectorSync } from "@/lib/connectors/pennylane/metrics";
import type {
  PennylaneCompanyTokenCredential,
  PennylaneCredential,
  PennylaneOAuthCredential,
} from "@/lib/connectors/pennylane/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadPennylaneCredential(
  userId: string,
  projectId: string,
): Promise<PennylaneCredential | null> {
  const stored = await loadConnectorCredential<PennylaneCredential>(
    userId,
    projectId,
    "pennylane",
  );
  return stored?.data ?? null;
}

async function persistPennylaneCredential(
  userId: string,
  projectId: string,
  credential: PennylaneCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "pennylane", credential, {
    authType: credential.authType,
    accountLabel: credential.companyName,
    companyId: credential.companyId,
    oauthConnected: credential.authType === "oauth",
    ...metadata,
  });
}

export async function savePennylaneCredential(
  userId: string,
  projectId: string,
  credential: PennylaneCredential,
): Promise<{ accountLabel: string; credential: PennylaneCredential }> {
  const meta = await validateCredential(credential);
  const enriched: PennylaneCredential = {
    ...credential,
    companyId: meta.companyId,
    companyName: meta.companyName,
  };

  await persistPennylaneCredential(userId, projectId, enriched, {
    accountLabel: meta.accountLabel,
    scopes: meta.scopes,
    sandbox: meta.sandbox,
  });

  return { accountLabel: meta.accountLabel, credential: enriched };
}

export async function runPennylaneSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const stored = await loadConnectorCredential<PennylaneCredential>(
    userId,
    projectId,
    "pennylane",
  );
  const credential = stored?.data ?? null;
  if (!credential) {
    throw new Error("Pennylane non connecté pour ce projet");
  }

  const { credential: fresh, refreshed } = await ensureFreshAccessToken(credential);
  const result = await fetchPennylaneConnectorSync(fresh);

  if (refreshed) {
    await persistPennylaneCredential(userId, projectId, fresh, {
      accountLabel: fresh.companyName ?? stored?.metadata?.accountLabel,
    });
  }

  const accountLabel =
    typeof stored?.metadata?.accountLabel === "string" && stored.metadata.accountLabel.trim()
      ? stored.metadata.accountLabel.trim()
      : fresh.companyName?.trim() || "Pennylane";

  return {
    ...result,
    accountLabel,
  };
}

export async function deletePennylaneCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  const credential = await loadPennylaneCredential(userId, projectId);
  if (credential?.authType === "oauth") {
    await revokePennylaneToken(credential.refreshToken);
    await revokePennylaneToken(credential.accessToken);
  }
  await deleteConnectorCredential(userId, projectId, "pennylane");
}

export async function exchangeAndStorePennylaneOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<{ accountLabel: string }> {
  const tokens = await exchangePennylaneCode(code);
  const oauthCredential: PennylaneOAuthCredential = {
    authType: "oauth",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: buildAccessTokenExpiry(tokens.expiresIn),
  };

  const { accountLabel } = await savePennylaneCredential(userId, projectId, oauthCredential);
  return { accountLabel };
}

export async function savePennylaneCompanyToken(
  userId: string,
  projectId: string,
  apiToken: string,
): Promise<{ accountLabel: string; credential: PennylaneCompanyTokenCredential }> {
  const credential: PennylaneCompanyTokenCredential = {
    authType: "company_token",
    apiToken: apiToken.trim(),
  };
  const saved = await savePennylaneCredential(userId, projectId, credential);
  return {
    accountLabel: saved.accountLabel,
    credential: saved.credential as PennylaneCompanyTokenCredential,
  };
}

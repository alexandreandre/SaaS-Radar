import "server-only";

import {
  ensureFreshAccessToken,
  getOrganization,
  listTransactionsForAccount,
} from "@/lib/connectors/qonto/client";
import {
  buildQontoFinanceStream,
  currentMonthSettledRange,
  sumBalanceCents,
} from "@/lib/connectors/qonto/snapshots";
import type { QontoBankAccount, QontoCredential } from "@/lib/connectors/qonto/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

function buildFallbackSync(credential: QontoCredential): ConnectorSyncResult {
  return {
    stream: {
      type: "finance",
      cashBalance: 12500,
      monthlyInflow: 8200,
      monthlyOutflow: 5400,
      runwayDays: 208,
    },
    accountLabel: credential.organizationName?.trim() || "Qonto",
    syncedAt: new Date().toISOString(),
    tokenExpiresAt: credential.accessTokenExpiresAt,
  };
}

function internalAccounts(accounts: QontoBankAccount[]): QontoBankAccount[] {
  return accounts.filter((account) => account.is_external_account !== true);
}

export async function fetchQontoConnectorSync(
  credential: QontoCredential,
): Promise<ConnectorSyncResult & { refreshedCredential?: QontoCredential }> {
  if (process.env.QONTO_CONNECTOR_FALLBACK === "1") {
    return buildFallbackSync(credential);
  }

  const { credential: freshCredential, refreshed } = await ensureFreshAccessToken(credential);
  const orgResponse = await getOrganization(freshCredential);
  const accounts = internalAccounts(
    orgResponse.organization.bank_accounts ?? [],
  );

  if (accounts.length === 0) {
    throw new Error("Aucun compte bancaire Qonto trouvé pour cette organisation");
  }

  if (sumBalanceCents(accounts) === 0 && accounts.every((a) => a.balance_cents === undefined)) {
    throw new Error(
      "Soldes Qonto non accessibles — votre rôle ne permet pas de lire les balances. Utilisez un compte owner/admin.",
    );
  }

  const { from, to } = currentMonthSettledRange();
  const allTransactions: import("@/lib/connectors/qonto/types").QontoTransaction[] = [];

  for (const account of accounts) {
    const transactions = await listTransactionsForAccount(
      freshCredential,
      account.id,
      from,
      to,
    );
    allTransactions.push(...transactions);
  }

  const stream = buildQontoFinanceStream({
    accounts,
    transactions: allTransactions,
  });

  const accountLabel =
    orgResponse.organization.legal_name?.trim() ||
    orgResponse.organization.name?.trim() ||
    freshCredential.organizationName ||
    "Qonto";

  return {
    stream,
    accountLabel,
    syncedAt: new Date().toISOString(),
    tokenExpiresAt: freshCredential.accessTokenExpiresAt,
    refreshedCredential: refreshed ? freshCredential : undefined,
  };
}

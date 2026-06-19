import "server-only";

import {
  buildAccountingStreamFromInvoiceTotals,
  buildAccountingStreamFromTrialBalance,
  getCurrentMonthPeriod,
} from "@/lib/connectors/pennylane/accounting-stream";
import {
  fetchAllTrialBalanceItems,
  fetchCustomerInvoiceTotal,
  fetchSupplierInvoiceTotal,
  PennylaneConnectorError,
} from "@/lib/connectors/pennylane/client";
import type { PennylaneCredential } from "@/lib/connectors/pennylane/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";
import type { AccountingStream } from "@/lib/connectors/streams";

function buildFallbackStream(): AccountingStream {
  return {
    type: "accounting",
    revenueBooked: 0,
    expensesBooked: 0,
    vatDue: 0,
  };
}

async function buildAccountingStream(
  credential: PennylaneCredential,
): Promise<AccountingStream> {
  const { periodStart, periodEnd } = getCurrentMonthPeriod();

  try {
    const items = await fetchAllTrialBalanceItems(credential, periodStart, periodEnd);
    return buildAccountingStreamFromTrialBalance(items);
  } catch (err) {
    if (!(err instanceof PennylaneConnectorError) || err.status !== 403) {
      throw err;
    }

    const [customerTotal, supplierTotal] = await Promise.all([
      fetchCustomerInvoiceTotal(credential, periodStart, periodEnd).catch(() => 0),
      fetchSupplierInvoiceTotal(credential, periodStart, periodEnd).catch(() => 0),
    ]);

    return buildAccountingStreamFromInvoiceTotals({ customerTotal, supplierTotal });
  }
}

export async function fetchPennylaneConnectorSync(
  credential: PennylaneCredential,
): Promise<ConnectorSyncResult> {
  if (process.env.PENNYLANE_CONNECTOR_FALLBACK === "1") {
    return {
      stream: buildFallbackStream(),
      accountLabel: credential.companyName?.trim() || "Pennylane",
      syncedAt: new Date().toISOString(),
    };
  }

  const stream = await buildAccountingStream(credential);

  return {
    stream,
    accountLabel: credential.companyName?.trim() || "Pennylane",
    syncedAt: new Date().toISOString(),
  };
}

import "server-only";

import { fetchRevenueTotals } from "@/lib/connectors/abby/billing";
import {
  fetchAllPurchaseRegisterItems,
  fetchPurchaseRegisterStatistics,
} from "@/lib/connectors/abby/purchase-register";
import {
  aggregatePurchaseRegister,
  buildAccountingStreamFromTotals,
  getCurrentMonthPeriod,
  normalizeBillingAmount,
} from "@/lib/connectors/abby/stream";
import type { AbbyCredential, AbbySyncMetadata } from "@/lib/connectors/abby/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";
import type { AccountingStream } from "@/lib/connectors/streams";

function buildFallbackStream(accountLabel: string): ConnectorSyncResult {
  return {
    stream: {
      type: "accounting",
      revenueBooked: 4200,
      expensesBooked: 980,
      vatDue: 644,
    },
    accountLabel,
    syncedAt: new Date().toISOString(),
  };
}

export async function fetchAbbyConnectorSync(
  credential: AbbyCredential,
): Promise<ConnectorSyncResult & AbbySyncMetadata> {
  if (process.env.ABBY_CONNECTOR_FALLBACK === "1") {
    const fallback = buildFallbackStream(
      credential.commercialName?.trim() || "Abby",
    );
    return {
      ...fallback,
      revenueSource: "unavailable",
      revenueUnavailable: true,
    };
  }

  const { periodStart, periodEnd } = getCurrentMonthPeriod();
  const accountLabel = credential.commercialName?.trim() || "Abby";

  const [purchaseItems, purchaseStats, revenueTotals] = await Promise.all([
    fetchAllPurchaseRegisterItems(credential, periodStart, periodEnd),
    fetchPurchaseRegisterStatistics(credential, periodStart, periodEnd),
    fetchRevenueTotals(credential, periodStart, periodEnd),
  ]);

  const purchaseAggregate = aggregatePurchaseRegister(
    purchaseItems,
    periodStart,
    periodEnd,
  );

  let expensesBooked = purchaseAggregate.expensesBooked;
  let vatDeductible = purchaseAggregate.vatDeductible;

  if (purchaseStats) {
    expensesBooked = normalizeBillingAmount(purchaseStats.withoutTax, "euros");
    vatDeductible = normalizeBillingAmount(purchaseStats.totalTax, "euros");
  }

  const { stream, revenueUnavailable } = buildAccountingStreamFromTotals({
    revenueBooked: revenueTotals.revenueBooked,
    expensesBooked,
    vatCollected: revenueTotals.vatCollected,
    vatDeductible,
    revenueSource: revenueTotals.revenueSource,
  });

  return {
    stream,
    accountLabel,
    syncedAt: new Date().toISOString(),
    revenueSource: revenueTotals.revenueSource,
    revenueUnavailable,
  };
}

export type { AccountingStream };

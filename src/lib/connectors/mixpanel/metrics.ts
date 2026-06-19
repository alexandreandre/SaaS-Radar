import "server-only";

import {
  formatDateOffset,
  runEventExport,
  runQueryBatch,
  runRetentionQuery,
  runSegmentationQuery,
} from "@/lib/connectors/mixpanel/client";
import { buildProductStreamFromQueries } from "@/lib/connectors/mixpanel/product-stream";
import {
  aggregateDailySegmentationToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromQueryResults,
  getMonthKeys,
  parseSegmentationMonthlyValues,
} from "@/lib/connectors/mixpanel/snapshots";
import type { MixpanelCredential } from "@/lib/connectors/mixpanel/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

function isFallbackEnabled(): boolean {
  return process.env.MIXPANEL_CONNECTOR_FALLBACK === "1";
}

export async function fetchMixpanelConnectorSync(
  credential: MixpanelCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  if (isFallbackEnabled()) {
    return {
      snapshots: buildSnapshotsFromQueryResults({
        monthKeys: getMonthKeys(months),
        mauByMonth: new Map(),
        dauByMonth: new Map(),
        signupsByMonth: new Map(),
      }),
      stream: buildProductStreamFromQueries({}),
      accountLabel: credential.projectLabel ?? credential.projectId,
      syncedAt: new Date().toISOString(),
    };
  }

  const monthKeys = getMonthKeys(months);
  const [start, end] = buildDateRangeForMonths(months);
  const activityEvent = credential.activityEvent ?? credential.signupEvent;

  if (!activityEvent) {
    throw new Error("Événement activité Mixpanel requis pour la synchronisation.");
  }

  const snapshotTasks: Array<() => Promise<unknown>> = [
    () =>
      runSegmentationQuery(credential, {
        event: activityEvent,
        fromDate: start,
        toDate: end,
        unit: "month",
        type: "unique",
      }),
    () =>
      runSegmentationQuery(credential, {
        event: activityEvent,
        fromDate: start,
        toDate: end,
        unit: "day",
        type: "unique",
      }),
  ];

  if (credential.signupEvent) {
    snapshotTasks.push(() =>
      runSegmentationQuery(credential, {
        event: credential.signupEvent!,
        fromDate: start,
        toDate: end,
        unit: "month",
        type: "unique",
      }),
    );
  }

  const productTasks: Array<() => Promise<unknown>> = [
    () =>
      runEventExport(credential, {
        fromDate: formatDateOffset(14),
        toDate: formatDateOffset(0),
        limit: 100_000,
      }),
  ];

  if (credential.signupEvent) {
    productTasks.push(() =>
      runRetentionQuery(credential, {
        fromDate: formatDateOffset(90),
        toDate: formatDateOffset(0),
        bornEvent: credential.signupEvent!,
      }),
    );

    if (credential.activationEvent) {
      productTasks.push(() =>
        runRetentionQuery(credential, {
          fromDate: formatDateOffset(90),
          toDate: formatDateOffset(0),
          bornEvent: credential.signupEvent!,
          event: credential.activationEvent!,
        }),
      );
    }
  }

  const [snapshotResults, productResults] = await Promise.all([
    runQueryBatch(snapshotTasks, 3),
    runQueryBatch(productTasks, 3),
  ]);

  const mauRes = snapshotResults[0] as Awaited<ReturnType<typeof runSegmentationQuery>>;
  const dauRes = snapshotResults[1] as Awaited<ReturnType<typeof runSegmentationQuery>>;
  const signupsRes = credential.signupEvent
    ? (snapshotResults[2] as Awaited<ReturnType<typeof runSegmentationQuery>>)
    : null;

  const mauByMonth = parseSegmentationMonthlyValues(mauRes, activityEvent);
  const dauByMonth = aggregateDailySegmentationToDau(dauRes, activityEvent);
  const signupsByMonth = signupsRes
    ? parseSegmentationMonthlyValues(signupsRes, credential.signupEvent!)
    : new Map<string, number>();

  const snapshots = buildSnapshotsFromQueryResults({
    monthKeys,
    mauByMonth,
    dauByMonth,
    signupsByMonth,
  });

  let productIdx = 0;
  const exportJsonl = productResults[productIdx++] as string;

  let retentionRes: Awaited<ReturnType<typeof runRetentionQuery>> | undefined;
  let activationRes: Awaited<ReturnType<typeof runRetentionQuery>> | undefined;

  if (credential.signupEvent) {
    retentionRes = productResults[productIdx++] as Awaited<
      ReturnType<typeof runRetentionQuery>
    >;
    if (credential.activationEvent) {
      activationRes = productResults[productIdx] as Awaited<
        ReturnType<typeof runRetentionQuery>
      >;
    }
  }

  const stream = buildProductStreamFromQueries({
    exportJsonl,
    retention: retentionRes,
    activationRetention: activationRes,
  });

  const accountLabel =
    credential.projectLabel?.trim() ||
    `Mixpanel ${credential.projectId} (${credential.region.toUpperCase()})`;

  return {
    snapshots,
    stream,
    accountLabel,
    syncedAt: new Date().toISOString(),
  };
}

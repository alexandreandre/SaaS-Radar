import "server-only";

import {
  buildActivationRateQuery,
  buildDauQuery,
  buildFeatureTopQuery,
  buildMauQuery,
  buildRetentionFallbackQuery,
  buildSignupsQuery,
  runHogQLQuery,
  runQueryBatch,
  runRetentionQuery,
} from "@/lib/connectors/posthog/client";
import { buildProductStreamFromQueries } from "@/lib/connectors/posthog/product-stream";
import {
  aggregateDailyRowsToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromQueryResults,
  getMonthKeys,
  hogQLRowsFromResults,
  parseHogQLMonthlyRows,
} from "@/lib/connectors/posthog/snapshots";
import type { PostHogCredential } from "@/lib/connectors/posthog/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function fetchPostHogConnectorSync(
  credential: PostHogCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  const monthKeys = getMonthKeys(months);
  const [start, end] = buildDateRangeForMonths(months);

  const snapshotTasks: Array<() => Promise<unknown>> = [
    () => runHogQLQuery(credential, buildMauQuery(start, end), "saas_radar_mau_monthly"),
    () => runHogQLQuery(credential, buildDauQuery(start, end), "saas_radar_dau_monthly"),
  ];

  if (credential.signupEvent) {
    snapshotTasks.push(() =>
      runHogQLQuery(
        credential,
        buildSignupsQuery(start, end, credential.signupEvent!),
        "saas_radar_signups_monthly",
      ),
    );
  }

  const productTasks: Array<() => Promise<unknown>> = [
    () => runHogQLQuery(credential, buildFeatureTopQuery(), "saas_radar_feature_top"),
  ];

  if (credential.signupEvent && credential.activationEvent) {
    productTasks.push(() =>
      runHogQLQuery(
        credential,
        buildActivationRateQuery(credential.signupEvent!, credential.activationEvent!),
        "saas_radar_activation_rate",
      ),
    );
  }

  if (credential.signupEvent) {
    productTasks.push(() =>
      runRetentionQuery(credential, credential.signupEvent!, "saas_radar_retention_d7"),
    );
  } else {
    productTasks.push(() =>
      runHogQLQuery(credential, buildRetentionFallbackQuery(), "saas_radar_retention_d7_fallback"),
    );
  }

  const [snapshotResults, productResults] = await Promise.all([
    runQueryBatch(snapshotTasks, 3),
    runQueryBatch(productTasks, 3),
  ]);

  const mauRes = snapshotResults[0] as Awaited<ReturnType<typeof runHogQLQuery>>;
  const dauRes = snapshotResults[1] as Awaited<ReturnType<typeof runHogQLQuery>>;
  const signupsRes = credential.signupEvent
    ? (snapshotResults[2] as Awaited<ReturnType<typeof runHogQLQuery>>)
    : { results: [], columns: [] };

  const mauByMonth = parseHogQLMonthlyRows(hogQLRowsFromResults(mauRes.results, mauRes.columns));
  const dauByMonth = aggregateDailyRowsToDau(hogQLRowsFromResults(dauRes.results, dauRes.columns));
  const signupsByMonth = parseHogQLMonthlyRows(
    hogQLRowsFromResults(signupsRes.results, signupsRes.columns),
  );

  const snapshots = buildSnapshotsFromQueryResults({
    monthKeys,
    mauByMonth,
    dauByMonth,
    signupsByMonth,
  });

  let productIdx = 0;
  const featureTopRes = productResults[productIdx++] as Awaited<ReturnType<typeof runHogQLQuery>>;

  let activationRes: Awaited<ReturnType<typeof runHogQLQuery>> | undefined;
  if (credential.signupEvent && credential.activationEvent) {
    activationRes = productResults[productIdx++] as Awaited<ReturnType<typeof runHogQLQuery>>;
  }

  const retentionRes = productResults[productIdx] as Awaited<ReturnType<typeof runHogQLQuery>>;

  const stream = buildProductStreamFromQueries({
    featureTop: featureTopRes,
    activationRate: activationRes,
    retention: retentionRes,
  });

  return {
    snapshots,
    stream,
    accountLabel: credential.projectId,
    syncedAt: new Date().toISOString(),
  };
}

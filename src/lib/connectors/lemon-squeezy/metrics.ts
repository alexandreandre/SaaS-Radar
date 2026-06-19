import "server-only";

import { fetchPrice, listStoreSubscriptions } from "@/lib/connectors/lemon-squeezy/client";
import {
  buildSnapshotsFromSubscriptions,
  getMonthKeys,
} from "@/lib/connectors/lemon-squeezy/snapshots";
import type { LemonSqueezyCredential, LemonSqueezyPriceAttributes } from "@/lib/connectors/lemon-squeezy/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

async function buildPriceMap(
  apiKey: string,
  subscriptions: Array<{ attributes: { first_subscription_item: { price_id: number } | null } }>,
): Promise<Map<string, LemonSqueezyPriceAttributes>> {
  const priceIds = new Set<string>();
  for (const sub of subscriptions) {
    const priceId = sub.attributes.first_subscription_item?.price_id;
    if (priceId) priceIds.add(String(priceId));
  }

  const priceMap = new Map<string, LemonSqueezyPriceAttributes>();
  await Promise.all(
    Array.from(priceIds).map(async (priceId) => {
      const price = await fetchPrice(apiKey, priceId);
      priceMap.set(priceId, price);
    }),
  );

  return priceMap;
}

export async function fetchLemonSqueezyConnectorSync(
  credential: LemonSqueezyCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  const subscriptions = await listStoreSubscriptions(credential);
  const priceMap = await buildPriceMap(credential.apiKey, subscriptions);
  const monthKeys = getMonthKeys(months);
  const snapshots = buildSnapshotsFromSubscriptions(subscriptions, priceMap, monthKeys);

  return {
    snapshots,
    accountLabel: credential.storeName,
    syncedAt: new Date().toISOString(),
  };
}

import { AdminMarketsClient } from "@/components/admin/markets-client";
import { listAdminMarkets } from "@/lib/admin/markets";

export async function AdminMarketsLoader() {
  let initialMarkets = null;
  let initialError: string | null = null;

  try {
    initialMarkets = await listAdminMarkets();
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return <AdminMarketsClient initialMarkets={initialMarkets} initialError={initialError} />;
}

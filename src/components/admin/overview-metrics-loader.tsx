import { OverviewClient } from "@/components/admin/overview-client";
import { getAdminOverviewMetrics } from "@/lib/admin/metrics";

export async function OverviewMetricsLoader() {
  let initialMetrics = null;
  let initialError: string | null = null;

  try {
    initialMetrics = await getAdminOverviewMetrics();
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return (
    <OverviewClient initialMetrics={initialMetrics} initialError={initialError} />
  );
}

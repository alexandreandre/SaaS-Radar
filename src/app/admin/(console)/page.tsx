import { Suspense } from "react";
import AdminConsoleLoading from "./loading";
import { OverviewMetricsLoader } from "@/components/admin/overview-metrics-loader";

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <OverviewMetricsLoader />
    </Suspense>
  );
}

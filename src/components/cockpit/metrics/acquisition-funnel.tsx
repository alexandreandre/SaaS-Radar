"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const AcquisitionFunnelChartInner = dynamic(
  () => import("./acquisition-funnel-inner").then((m) => ({ default: m.AcquisitionFunnelChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function AcquisitionFunnelChart(props: ComponentProps<typeof AcquisitionFunnelChartInner>) {
  return <AcquisitionFunnelChartInner {...props} />;
}

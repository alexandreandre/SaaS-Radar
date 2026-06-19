"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const EngagementTrendChartInner = dynamic(
  () => import("./engagement-trend-chart-inner").then((m) => ({ default: m.EngagementTrendChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function EngagementTrendChart(props: ComponentProps<typeof EngagementTrendChartInner>) {
  return <EngagementTrendChartInner {...props} />;
}

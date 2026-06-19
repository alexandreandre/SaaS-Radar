"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const RunwayChartInner = dynamic(
  () => import("./runway-chart-inner").then((m) => ({ default: m.RunwayChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function RunwayChart(props: ComponentProps<typeof RunwayChartInner>) {
  return <RunwayChartInner {...props} />;
}

"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const MrrBreakdownChartInner = dynamic(
  () => import("./mrr-breakdown-chart-inner").then((m) => ({ default: m.MrrBreakdownChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function MrrBreakdownChart(props: ComponentProps<typeof MrrBreakdownChartInner>) {
  return <MrrBreakdownChartInner {...props} />;
}

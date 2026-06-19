"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ArrLineChartInner = dynamic(
  () => import("./arr-line-chart-inner").then((m) => ({ default: m.ArrLineChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function ArrLineChart(props: ComponentProps<typeof ArrLineChartInner>) {
  return <ArrLineChartInner {...props} />;
}

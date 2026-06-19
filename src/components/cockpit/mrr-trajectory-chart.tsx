"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

export type { DualChartPoint } from "./mrr-trajectory-chart-inner";

const MrrTrajectoryChartInner = dynamic(
  () => import("./mrr-trajectory-chart-inner").then((m) => ({ default: m.MrrTrajectoryChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function MrrTrajectoryChart(props: ComponentProps<typeof MrrTrajectoryChartInner>) {
  return <MrrTrajectoryChartInner {...props} />;
}

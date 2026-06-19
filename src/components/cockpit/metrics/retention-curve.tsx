"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const RetentionCurveChartInner = dynamic(
  () => import("./retention-curve-inner").then((m) => ({ default: m.RetentionCurveChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function RetentionCurveChart(props: ComponentProps<typeof RetentionCurveChartInner>) {
  return <RetentionCurveChartInner {...props} />;
}

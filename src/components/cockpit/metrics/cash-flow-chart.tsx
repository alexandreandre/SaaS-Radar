"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const CashFlowChartInner = dynamic(
  () => import("./cash-flow-chart-inner").then((m) => ({ default: m.CashFlowChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function CashFlowChart(props: ComponentProps<typeof CashFlowChartInner>) {
  return <CashFlowChartInner {...props} />;
}

"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const SpendByChannelChartInner = dynamic(
  () => import("./spend-by-channel-chart-inner").then((m) => ({ default: m.SpendByChannelChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function SpendByChannelChart(props: ComponentProps<typeof SpendByChannelChartInner>) {
  return <SpendByChannelChartInner {...props} />;
}

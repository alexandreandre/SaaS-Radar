"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const RoasByChannelChartInner = dynamic(
  () => import("./roas-by-channel-inner").then((m) => ({ default: m.RoasByChannelChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function RoasByChannelChart(props: ComponentProps<typeof RoasByChannelChartInner>) {
  return <RoasByChannelChartInner {...props} />;
}

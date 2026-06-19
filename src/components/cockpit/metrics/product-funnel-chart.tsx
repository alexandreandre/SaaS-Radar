"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ProductFunnelChartInner = dynamic(
  () => import("./product-funnel-chart-inner").then((m) => ({ default: m.ProductFunnelChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function ProductFunnelChart(props: ComponentProps<typeof ProductFunnelChartInner>) {
  return <ProductFunnelChartInner {...props} />;
}

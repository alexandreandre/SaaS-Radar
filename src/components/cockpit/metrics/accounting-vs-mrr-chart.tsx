"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const AccountingVsMrrChartInner = dynamic(
  () => import("./accounting-vs-mrr-chart-inner").then((m) => ({ default: m.AccountingVsMrrChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function AccountingVsMrrChart(props: ComponentProps<typeof AccountingVsMrrChartInner>) {
  return <AccountingVsMrrChartInner {...props} />;
}

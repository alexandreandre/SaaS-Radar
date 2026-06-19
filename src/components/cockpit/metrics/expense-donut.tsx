"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ExpenseDonutChartInner = dynamic(
  () => import("./expense-donut-inner").then((m) => ({ default: m.ExpenseDonutChartInner })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}


export function ExpenseDonutChart(props: ComponentProps<typeof ExpenseDonutChartInner>) {
  return <ExpenseDonutChartInner {...props} />;
}

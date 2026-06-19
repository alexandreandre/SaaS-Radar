"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

const ChartSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-lg bg-muted/50", className)} aria-hidden />
);

type LazyChartProps = {
  loader: () => Promise<{ default: ComponentType<Record<string, unknown>> }>;
  chartProps: Record<string, unknown>;
  className?: string;
  skeletonClassName?: string;
};

/**
 * Boundary lazy pour Recharts — évite le coût bundle sur les routes hors métriques.
 */
export function LazyChart({ loader, chartProps, className, skeletonClassName }: LazyChartProps) {
  const Chart = dynamic(loader, {
    ssr: false,
    loading: () => <ChartSkeleton className={skeletonClassName ?? "h-64 w-full"} />,
  });

  return (
    <div className={className}>
      <Chart {...chartProps} />
    </div>
  );
}

export function LazyChartShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("min-h-[16rem]", className)}>{children}</div>;
}

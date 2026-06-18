import type { ProjectCardMetric } from "@/lib/portfolio-card-copy";
import { cn } from "@/lib/utils";

type ProjectCardMetricsProps = {
  metrics: ProjectCardMetric[];
  className?: string;
  muted?: boolean;
};

function MetricDelta({
  delta,
  invert,
}: {
  delta: number | null;
  invert?: boolean;
}) {
  if (delta === null) {
    return (
      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">—</span>
    );
  }

  if (delta === 0) {
    return (
      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">0 %</span>
    );
  }

  const positive = delta > 0;
  const good = invert ? !positive : positive;

  return (
    <span
      className={cn(
        "text-[10px] font-semibold tabular-nums",
        good ? "text-emerald-600" : "text-red-600",
      )}
    >
      {positive ? "+" : ""}
      {delta} %
    </span>
  );
}

export function ProjectCardMetrics({ metrics, className, muted }: ProjectCardMetricsProps) {
  return (
    <div
      className={cn(
        "mt-5 grid grid-cols-3 divide-x divide-border/70 border-y border-border/70 py-3.5",
        muted && "opacity-60",
        className,
      )}
      aria-label="Indicateurs clés"
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="min-w-0 px-3 first:pl-0 last:pr-0">
          <p className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {metric.label}
          </p>
          <div className="mt-1 flex min-w-0 items-baseline gap-1.5">
            <span className="truncate text-base font-semibold tabular-nums tracking-tight text-foreground">
              {metric.value}
            </span>
            <MetricDelta delta={metric.deltaPct} invert={metric.invertDelta} />
          </div>
        </div>
      ))}
    </div>
  );
}

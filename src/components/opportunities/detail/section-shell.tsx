import { TierBadge } from "@/components/billing/tier-badge";
import { TOTAL_DETAIL_STEPS } from "@/components/opportunities/detail/detail-sections";
import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/tier";

export function SectionShell({
  id,
  title,
  subtitle,
  step,
  requiredTier,
  children,
  className,
  variant = "default",
  emphasize = false,
}: {
  id: string;
  title: string;
  subtitle?: string;
  step?: number;
  requiredTier?: Tier;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "premium" | "pro";
  emphasize?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-28 rounded-xl border p-6 shadow-card sm:p-8",
        emphasize && "ring-1 ring-primary/15",
        variant === "default" && "border-border bg-card",
        variant === "premium" && "border-primary/25 bg-accent/15",
        variant === "pro" && "border-primary/35 bg-gradient-to-b from-accent/25 to-card ring-1 ring-primary/15",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          {step != null && (
            <span
              className={cn(
                "font-data font-medium uppercase tracking-data text-primary",
                emphasize ? "text-sm" : "text-xs"
              )}
            >
              Étape {step}
              {emphasize && (
                <span className="text-muted-foreground">
                  {" "}
                  · {step} / {TOTAL_DETAIL_STEPS}
                </span>
              )}
            </span>
          )}
          <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
        {requiredTier && requiredTier !== "free" && <TierBadge tier={requiredTier} />}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

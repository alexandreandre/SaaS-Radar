import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/tier";

const labels: Record<Tier, string> = {
  free: "Gratuit",
  builder: "Abonnement Builder",
  pro: "Abonnement Pro",
};

const styles: Record<Tier, string> = {
  free: "bg-muted text-muted-foreground",
  builder: "bg-primary text-primary-foreground",
  pro: "bg-accent text-accent-foreground ring-1 ring-primary/30",
};

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  if (tier === "free") return null;
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold",
        styles[tier],
        className
      )}
    >
      {labels[tier]}
    </span>
  );
}

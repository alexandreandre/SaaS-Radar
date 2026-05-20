"use client";

import { useTier } from "@/contexts/tier-context";
import { hasTier, nextTierFor, type Tier } from "@/lib/tier";
import { cn } from "@/lib/utils";
import { TierBadge } from "@/components/billing/tier-badge";
import { UnlockCta, unlockMessage } from "@/components/billing/unlock-cta";
import { Lock } from "lucide-react";

export function PaywallGate({
  requiredTier,
  preview,
  children,
  className,
  message,
}: {
  requiredTier: Tier;
  preview?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  message?: string;
}) {
  const { tier } = useTier();
  const unlocked = hasTier(tier, requiredTier);

  if (unlocked) {
    return <div className={className}>{children}</div>;
  }

  const unlockTier = requiredTier === "free" ? "builder" : nextTierFor(requiredTier);

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-dashed border-primary/30", className)}>
      {preview && (
        <div className="border-b border-border bg-muted/50 px-6 py-4 text-base text-muted-foreground">{preview}</div>
      )}
      <div className="relative max-h-[240px] overflow-hidden">
        <div className="pointer-events-none select-none blur-md opacity-80">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-card/80 px-8 py-10 backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-9 w-9 text-primary" strokeWidth={2} aria-hidden />
          </div>
          <TierBadge tier={unlockTier} className="text-xs px-3 py-1" />
          <p className="max-w-md text-center text-base font-medium leading-relaxed text-foreground">
            {message ?? unlockMessage(requiredTier)}
          </p>
          <UnlockCta requiredTier={unlockTier} size="lg" />
        </div>
      </div>
    </div>
  );
}

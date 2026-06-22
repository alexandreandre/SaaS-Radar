"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CampaignGuidedStepProps = {
  step: number;
  title: string;
  done: boolean;
  defaultOpen?: boolean;
  id?: string;
  children: React.ReactNode;
};

export function CampaignGuidedStep({
  step,
  title,
  done,
  defaultOpen = false,
  id,
  children,
}: CampaignGuidedStepProps) {
  return (
    <details
      id={id}
      open={defaultOpen || !done}
      className="group rounded-xl border border-border bg-card shadow-card"
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden",
          done && "opacity-90",
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            done
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-primary/10 text-primary",
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" /> : step}
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold">{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}

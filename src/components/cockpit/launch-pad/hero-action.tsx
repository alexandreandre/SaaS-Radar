"use client";

import { Check } from "lucide-react";
import type { Milestone } from "@/lib/portfolio";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type HeroActionProps = {
  milestone: Milestone | null;
  fallbackLabel: string;
  onToggle: (milestoneId: string) => void;
};

export function HeroAction({ milestone, fallbackLabel, onToggle }: HeroActionProps) {
  const label = milestone?.label.replace(/^S\d+ — /, "") ?? fallbackLabel;
  const done = milestone?.done ?? false;

  const handleToggle = () => {
    if (milestone) onToggle(milestone.id);
  };

  return (
    <section className="rounded-xl border-2 border-primary/30 bg-card p-6 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">Aujourd&apos;hui</p>
      <label
        className={cn(
          "mt-4 flex cursor-pointer items-start gap-4 rounded-lg transition-colors",
          done && "opacity-70"
        )}
      >
        <Checkbox
          checked={done}
          onCheckedChange={handleToggle}
          className="mt-1 h-5 w-5"
          disabled={!milestone}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-base font-medium leading-relaxed",
              done && "line-through text-muted-foreground"
            )}
          >
            {label}
          </p>
          {done ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <Check className="h-4 w-4" />
              C&apos;est fait — passez à la suite
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Cochez quand c&apos;est fait ou quand vous vous engagez à le faire aujourd&apos;hui.
            </p>
          )}
        </div>
      </label>
    </section>
  );
}

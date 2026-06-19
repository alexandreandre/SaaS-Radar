"use client";

import type { Opportunity } from "@/types/opportunity";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getChannelLabel, resolveExtendedChannelKey } from "@/lib/campaign/channels";
import { cn } from "@/lib/utils";

type CampaignChannelCardProps = {
  opportunity: Opportunity;
  selected: ExtendedChannelKey;
  onSelect: (channel: ExtendedChannelKey) => void;
};

export function CampaignChannelCard({
  opportunity,
  selected,
  onSelect,
}: CampaignChannelCardProps) {
  const tabs = opportunity.acquisition;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">
        Canal prioritaire
      </p>
      <h3 className="mt-1 text-lg font-semibold">Où lancer en premier ?</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const key = resolveExtendedChannelKey(tab.title);
          const isSelected = key === selected;
          return (
            <button
              key={tab.id ?? tab.title}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {getChannelLabel(key)}
            </button>
          );
        })}
      </div>
      {tabs.find((t) => resolveExtendedChannelKey(t.title) === selected) ? (
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          {(
            tabs.find((t) => resolveExtendedChannelKey(t.title) === selected)?.tactics ?? []
          ).map((tactic) => (
            <li key={tactic} className="flex gap-2">
              <span className="text-primary">·</span>
              {tactic}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

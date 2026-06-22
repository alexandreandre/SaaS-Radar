"use client";

import { Checkbox } from "@/components/ui/checkbox";

type CampaignAssetChecklistProps = {
  items: string[];
  checkedIndices: number[];
  onToggle: (index: number) => void;
};

export function CampaignAssetChecklist({
  items,
  checkedIndices,
  onToggle,
}: CampaignAssetChecklistProps) {
  if (items.length === 0) return null;

  const done = checkedIndices.length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Checklist assets</h4>
        <span className="text-xs text-muted-foreground">
          {done}/{items.length} · {pct}%
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <Checkbox
              checked={checkedIndices.includes(i)}
              onCheckedChange={() => onToggle(i)}
              className="mt-0.5"
            />
            <span
              className={
                checkedIndices.includes(i)
                  ? "text-sm text-muted-foreground line-through"
                  : "text-sm"
              }
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

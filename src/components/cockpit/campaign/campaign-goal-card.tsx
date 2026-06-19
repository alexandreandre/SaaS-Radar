"use client";

import { useState } from "react";
import type { Opportunity } from "@/types/opportunity";
import type { CampaignSmartGoal } from "@/lib/campaign/kits";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getChannelLabel, resolveExtendedChannelKey } from "@/lib/campaign/channels";
import { isChannelAllowedForStage } from "@/lib/campaign/stages";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CampaignGoalCardProps = {
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  smartGoal?: CampaignSmartGoal;
  icpSummary?: string;
  onChannelSelect: (channel: ExtendedChannelKey) => void;
  onSave: (goal: CampaignSmartGoal, icpSummary: string) => void;
  collapsed?: boolean;
};

export function CampaignGoalCard({
  opportunity,
  stage,
  channel,
  smartGoal,
  icpSummary: icpProp,
  onChannelSelect,
  onSave,
  collapsed,
}: CampaignGoalCardProps) {
  const [label, setLabel] = useState(smartGoal?.label ?? "");
  const [targetValue, setTargetValue] = useState(String(smartGoal?.targetValue ?? 10));
  const [horizonDays, setHorizonDays] = useState(String(smartGoal?.horizonDays ?? 14));
  const [icp, setIcp] = useState(icpProp ?? "");

  if (collapsed && smartGoal && icpProp) {
    return (
      <section className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
        <p className="text-sm font-medium">{smartGoal.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {getChannelLabel(channel)} · {icpProp.slice(0, 100)}
          {icpProp.length > 100 ? "…" : ""}
        </p>
      </section>
    );
  }

  const tabs = opportunity.acquisition.filter((tab) =>
    isChannelAllowedForStage(stage, resolveExtendedChannelKey(tab.title)),
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">Étape 1</p>
        <h3 className="mt-1 text-lg font-semibold">Objectif & cible</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Un objectif clair et un ICP — avant tout contenu ou outil.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="campaign-goal-label">Objectif SMART</Label>
          <Input
            id="campaign-goal-label"
            className="mt-1.5"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex. 10 premières conversations qualifiées"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="campaign-goal-target">Cible (nombre)</Label>
            <Input
              id="campaign-goal-target"
              type="number"
              min={1}
              className="mt-1.5"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="campaign-goal-horizon">Horizon (jours)</Label>
            <Input
              id="campaign-goal-horizon"
              type="number"
              min={7}
              className="mt-1.5"
              value={horizonDays}
              onChange={(e) => setHorizonDays(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="campaign-icp">ICP (qui cibler)</Label>
          <textarea
            id="campaign-icp"
            className="mt-1.5 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={icp}
            onChange={(e) => setIcp(e.target.value)}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Canal prioritaire</p>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const key = resolveExtendedChannelKey(tab.title);
              const isSelected = key === channel;
              return (
                <button
                  key={tab.id ?? tab.title}
                  type="button"
                  onClick={() => onChannelSelect(key)}
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
        </div>

        <Button
          type="button"
          onClick={() => {
            const goal: CampaignSmartGoal = {
              label: label.trim() || "Objectif campagne",
              metric: "conversations",
              targetValue: Math.max(1, parseInt(targetValue, 10) || 10),
              horizonDays: Math.max(7, parseInt(horizonDays, 10) || 14),
              setAt: new Date().toISOString(),
            };
            onSave(goal, icp.trim());
          }}
        >
          Valider la cible
        </Button>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CampaignSmartGoal } from "@/lib/campaign/kits";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getChannelLabel, resolveExtendedChannelKey } from "@/lib/campaign/channels";
import { isChannelAllowedForStage } from "@/lib/campaign/stages";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import { profileFromStage } from "@/lib/campaign/stages";
import {
  getCacNoteForChannel,
  recommendSmartGoalFromOpportunity,
} from "@/lib/campaign/recommend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTier } from "@/contexts/tier-context";
import { cn } from "@/lib/utils";

type CampaignGoalCardProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  smartGoal?: CampaignSmartGoal;
  icpSummary?: string;
  onChannelSelect: (channel: ExtendedChannelKey) => void;
  onSave: (goal: CampaignSmartGoal, icpSummary: string) => void;
  onApplyFullPlan?: (data: {
    smartGoal: CampaignSmartGoal;
    icpSummary: string;
    positioning: string;
    strategyBrief: string;
    actionItems?: import("@/lib/campaign/stages").CampaignActionItem[];
    activeSequenceId?: string;
  }) => void;
  collapsed?: boolean;
  highlightFullPlan?: boolean;
};

export function CampaignGoalCard({
  project,
  opportunity,
  stage,
  channel,
  smartGoal,
  icpSummary: icpProp,
  onChannelSelect,
  onSave,
  onApplyFullPlan,
  collapsed,
  highlightFullPlan,
}: CampaignGoalCardProps) {
  const { tier } = useTier();
  const canUseBuilder = tier === "builder" || tier === "pro";
  const defaultGoal = recommendSmartGoalFromOpportunity(opportunity, stage);
  const cacNote = getCacNoteForChannel(opportunity, channel);

  const [label, setLabel] = useState(smartGoal?.label ?? defaultGoal.label);
  const [targetValue, setTargetValue] = useState(
    String(smartGoal?.targetValue ?? defaultGoal.targetValue),
  );
  const [horizonDays, setHorizonDays] = useState(
    String(smartGoal?.horizonDays ?? defaultGoal.horizonDays),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function generateFullPlan() {
    if (!onApplyFullPlan) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaign/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          opportunitySlug: opportunity.slug,
          productName: project.productName ?? opportunity.name,
          profile: profileFromStage(stage),
          channelKey: channel,
          acquisitionStage: stage,
        }),
      });
      const data = (await res.json()) as {
        strategyBrief?: string;
        positioning?: string;
        icpSummary?: string;
        actionItems?: import("@/lib/campaign/stages").CampaignActionItem[];
        activeSequenceId?: string;
        channelKey?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Échec génération");
      const goal: CampaignSmartGoal = {
        label: label.trim() || defaultGoal.label,
        metric: defaultGoal.metric,
        targetValue: Math.max(1, parseInt(targetValue, 10) || defaultGoal.targetValue),
        horizonDays: Math.max(7, parseInt(horizonDays, 10) || defaultGoal.horizonDays),
        setAt: new Date().toISOString(),
      };
      onApplyFullPlan({
        smartGoal: goal,
        icpSummary: data.icpSummary ?? icpProp ?? "",
        positioning: data.positioning ?? "",
        strategyBrief: data.strategyBrief ?? "",
        actionItems: data.actionItems,
        activeSequenceId: data.activeSequenceId,
      });
      if (data.icpSummary) {
        /* icp saved via onApplyFullPlan */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">Phase 1 · Objectif</p>
        <h3 className="mt-1 text-lg font-semibold">Objectif & canal</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Un objectif SMART et votre canal prioritaire — l&apos;ICP se remplit à l&apos;étape suivante.
        </p>
      </div>

      {cacNote ? (
        <div className="mb-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Budget indicatif {getChannelLabel(channel)} : ~{cacNote.estimate} € · {cacNote.note}
        </div>
      ) : null}

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

        {!icpProp?.trim() ? (
          <p className="text-xs text-muted-foreground">
            L&apos;ICP se complète à l&apos;étape « ICP structuré » juste en dessous.
          </p>
        ) : (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
            ICP enregistré : {icpProp.slice(0, 120)}
            {icpProp.length > 120 ? "…" : ""}
          </p>
        )}

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

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              const goal: CampaignSmartGoal = {
                label: label.trim() || "Objectif campagne",
                metric: defaultGoal.metric,
                targetValue: Math.max(1, parseInt(targetValue, 10) || 10),
                horizonDays: Math.max(7, parseInt(horizonDays, 10) || 14),
                setAt: new Date().toISOString(),
              };
              onSave(goal, icpProp?.trim() ?? "");
            }}
          >
            Valider l&apos;objectif
          </Button>
          {canUseBuilder && onApplyFullPlan ? (
            <Button
              type="button"
              variant={highlightFullPlan ? "default" : "outline"}
              onClick={generateFullPlan}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Générer mon plan complet
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </section>
  );
}

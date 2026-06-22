"use client";

import { useEffect, useState } from "react";
import type { CampaignWeeklyCheckIn, CampaignSmartGoal } from "@/lib/campaign/kits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampaignWeeklyCheckInProps = {
  checkIns: CampaignWeeklyCheckIn[];
  smartGoal?: CampaignSmartGoal;
  suggestedMetricValue?: number;
  onSubmit: (checkIn: CampaignWeeklyCheckIn) => void;
  prominent?: boolean;
};

const METRIC_LABELS: Record<NonNullable<CampaignSmartGoal["metric"]>, string> = {
  conversations: "Conversations cette semaine",
  signups: "Signups cette semaine",
  customers: "Clients cette semaine",
  mrr: "MRR ajouté (€)",
};

export function CampaignWeeklyCheckInForm({
  checkIns,
  smartGoal,
  suggestedMetricValue,
  onSubmit,
  prominent,
}: CampaignWeeklyCheckInProps) {
  const [metricValue, setMetricValue] = useState("");
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<CampaignWeeklyCheckIn["mood"]>("on_track");

  useEffect(() => {
    if (metricValue === "" && suggestedMetricValue != null && suggestedMetricValue > 0) {
      setMetricValue(String(suggestedMetricValue));
    }
  }, [suggestedMetricValue, metricValue]);

  const metricLabel = smartGoal?.metric
    ? METRIC_LABELS[smartGoal.metric]
    : "Résultat cette semaine (nombre)";

  return (
    <section
      className={
        prominent
          ? "rounded-xl border-0 bg-card p-5 shadow-none"
          : "rounded-xl border border-border bg-card p-5 shadow-card"
      }
    >
      <h3 className="text-sm font-semibold">Check-in hebdo</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {smartGoal
          ? `Objectif : ${smartGoal.label} (${smartGoal.targetValue} en ${smartGoal.horizonDays} j)`
          : "2 minutes — où en êtes-vous vs votre objectif ?"}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="checkin-metric">{metricLabel}</Label>
          <Input
            id="checkin-metric"
            type="number"
            min={0}
            className="mt-1.5"
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="checkin-notes">Notes</Label>
          <textarea
            id="checkin-notes"
            className="mt-1.5 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Blocages, wins, prochaine priorité…"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["on_track", "Sur la bonne voie"],
              ["stuck", "Bloqué"],
              ["pivot", "Pivot"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={mood === value ? "default" : "outline"}
              onClick={() => setMood(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => {
            const parsed = metricValue ? parseInt(metricValue, 10) : undefined;
            onSubmit({
              date: new Date().toISOString().slice(0, 10),
              metricValue: parsed,
              notes: notes.trim() || undefined,
              mood,
            });
            setMetricValue("");
            setNotes("");
          }}
        >
          Enregistrer le check-in
        </Button>
      </div>

      {checkIns.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
          {checkIns.slice(-3).reverse().map((c) => (
            <li key={c.date}>
              <span className="font-medium text-foreground">{c.date}</span>
              {c.metricValue != null ? ` · ${c.metricValue}` : ""}
              {c.mood ? ` · ${c.mood}` : ""}
              {c.notes ? ` — ${c.notes}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Flame, TrendingUp } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import { daysSince, getNewlyCrossedMrrMilestone } from "@/lib/portfolio";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type MrrCheckInProps = {
  project: UserProject;
  onRecord: (amount: number, note?: string) => void;
  compact?: boolean;
};

export function MrrCheckIn({ project, onRecord, compact = false }: MrrCheckInProps) {
  const [amount, setAmount] = useState(String(project.currentMrr));
  const [note, setNote] = useState("");
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    setAmount(String(project.currentMrr));
  }, [project.currentMrr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = Number(amount) || 0;
    const previous = project.currentMrr;

    const milestone = getNewlyCrossedMrrMilestone(previous, next);
    if (milestone) {
      setCelebration(`${milestone.toLocaleString("fr-FR")} € MRR atteint !`);
    } else {
      setCelebration("Check-in enregistré");
    }

    onRecord(next, note.trim() || undefined);
    setNote("");
    setTimeout(() => setCelebration(null), 4000);
  };

  const days = daysSince(project.lastCheckInAt ?? project.createdAt);

  return (
    <section className={compact ? "" : "rounded-xl border border-border bg-card p-6 shadow-card"}>
      {!compact ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-data text-[10px] uppercase tracking-data text-primary">
              Check-in mensuel
            </p>
            <h2 className="mt-1 text-lg font-semibold">Mettre à jour votre MRR</h2>
          </div>
          {project.checkInStreak > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-700">
              <Flame className="h-3.5 w-3.5" />
              {project.checkInStreak} mois
            </div>
          ) : null}
        </div>
      ) : null}

      {!compact && days !== null ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Dernier check-in il y a {days} jour{days > 1 ? "s" : ""}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "mt-5 space-y-4"}>
        <div className="space-y-2">
          <Label htmlFor="mrr-amount">MRR actuel</Label>
          <div className="relative">
            <input
              id="mrr-amount"
              type="number"
              min={0}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-lg font-semibold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mrr-note">Note (optionnel)</Label>
          <input
            id="mrr-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="+2 clients ce mois"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <Button type="submit" className="w-full">
          Enregistrer le check-in
        </Button>
      </form>

      {celebration ? (
        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800 animate-pulse"
          )}
        >
          <TrendingUp className="h-4 w-4" />
          {celebration}
        </div>
      ) : null}

      {!compact && project.mrrHistory.length > 0 ? (
        <ul className="mt-5 max-h-32 space-y-2 overflow-y-auto border-t border-border pt-5 text-xs text-muted-foreground">
          {[...project.mrrHistory].reverse().slice(0, 6).map((entry) => (
            <li key={`${entry.date}-${entry.amount}`} className="flex justify-between gap-2">
              <span>{new Date(entry.date).toLocaleDateString("fr-FR")}</span>
              <span className="font-data text-foreground">{formatCurrency(entry.amount)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

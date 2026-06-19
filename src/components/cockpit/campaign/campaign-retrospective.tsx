"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type CampaignRetrospectiveCardProps = {
  onComplete: (data: { worked: string; blocked: string; nextChange: string }) => void;
  onStartNewCycle: () => void;
  completed?: boolean;
};

export function CampaignRetrospectiveCard({
  onComplete,
  onStartNewCycle,
  completed,
}: CampaignRetrospectiveCardProps) {
  const [worked, setWorked] = useState("");
  const [blocked, setBlocked] = useState("");
  const [nextChange, setNextChange] = useState("");

  if (completed) {
    return (
      <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-card">
        <p className="text-sm font-medium">Cycle terminé — prêt pour le suivant ?</p>
        <Button type="button" className="mt-3" onClick={onStartNewCycle}>
          Démarrer un nouveau cycle
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold">Rétrospective (15 min)</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Clôturez ce cycle avant d&apos;en lancer un autre.
      </p>
      <div className="mt-4 space-y-3">
        {(
          [
            ["worked", "Qu'est-ce qui a marché ?", worked, setWorked],
            ["blocked", "Qu'est-ce qui a bloqué ?", blocked, setBlocked],
            ["next", "Que changez-vous au prochain cycle ?", nextChange, setNextChange],
          ] as const
        ).map(([id, label, value, setter]) => (
          <div key={id}>
            <Label htmlFor={`retro-${id}`}>{label}</Label>
            <textarea
              id={`retro-${id}`}
              className="mt-1.5 flex min-h-[56px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={value}
              onChange={(e) => setter(e.target.value)}
            />
          </div>
        ))}
        <Button
          type="button"
          onClick={() =>
            onComplete({
              worked: worked.trim(),
              blocked: blocked.trim(),
              nextChange: nextChange.trim(),
            })
          }
          disabled={!worked.trim() || !nextChange.trim()}
        >
          Clôturer le cycle
        </Button>
      </div>
    </section>
  );
}

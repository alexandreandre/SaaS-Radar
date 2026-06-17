"use client";

import { Rocket, TrendingUp, Hammer } from "lucide-react";
import type { BuilderStage } from "@/lib/build-launch";
import { cn } from "@/lib/utils";

const STAGES: {
  id: BuilderStage;
  label: string;
  description: string;
  icon: typeof Rocket;
}[] = [
  {
    id: "starting",
    label: "Je démarre aujourd'hui",
    description: "Première ligne de code ou landing à créer",
    icon: Rocket,
  },
  {
    id: "building",
    label: "J'ai déjà avancé",
    description: "Repo, landing ou premiers contacts en cours",
    icon: Hammer,
  },
  {
    id: "has_mrr",
    label: "J'ai déjà du MRR",
    description: "Des clients payants ou un revenu récurrent",
    icon: TrendingUp,
  },
];

type StagePickerProps = {
  value: BuilderStage;
  onChange: (stage: BuilderStage) => void;
};

export function StagePicker({ value, onChange }: StagePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Où en êtes-vous ?</p>
      <div className="space-y-2">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const selected = value === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onChange(stage.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  selected ? "text-primary" : "text-muted-foreground"
                )}
              />
              <div>
                <p className={cn("text-sm font-medium", selected && "text-primary")}>
                  {stage.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

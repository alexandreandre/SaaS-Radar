"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { BuilderStage } from "@/lib/build-launch";
import { getLaunchTeaser, getQuickLaunchDefaults } from "@/lib/build-launch";
import { usePortfolio } from "@/contexts/portfolio-context";
import { StagePicker } from "@/components/cockpit/quick-launch/stage-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuickLaunchSheetProps = {
  opportunity: Opportunity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLaunch: (input: {
    startedAt: string;
    currentMrr: number;
    targetScenario: "Prudent" | "Réaliste" | "Optimiste";
    builderStage: BuilderStage;
  }) => void;
};

export function QuickLaunchSheet({
  opportunity,
  open,
  onOpenChange,
  onLaunch,
}: QuickLaunchSheetProps) {
  const router = useRouter();
  const { addProject } = usePortfolio();
  const [stage, setStage] = useState<BuilderStage>("starting");
  const teaser = getLaunchTeaser(opportunity);

  const handleSubmit = () => {
    const defaults = getQuickLaunchDefaults(stage);
    const project = addProject(opportunity.slug, defaults);
    onLaunch(defaults);
    onOpenChange(false);
    if (project) {
      router.push(`/cockpit/${project.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Prêt à builder {opportunity.name} ?</DialogTitle>
          <DialogDescription>
            Un clic pour démarrer — votre première action vous attend dans le cockpit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{opportunity.pitch}</p>
                <p className="mt-2 text-xs font-medium text-primary">{teaser}</p>
              </div>
            </div>
          </div>

          <StagePicker value={stage} onChange={setStage} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
          <Button onClick={handleSubmit}>
            Lancer mon build
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

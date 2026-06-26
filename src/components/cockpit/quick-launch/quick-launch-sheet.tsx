"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { BuilderStage } from "@/lib/build-launch";
import { getLaunchTeaser, getQuickLaunchDefaults } from "@/lib/build-launch";
import { usePortfolio } from "@/contexts/portfolio-context";
import { useSession } from "@/contexts/session-context";
import { uploadAccountProject } from "@/lib/portfolio-sync-client";
import { getCockpitHref } from "@/lib/cockpit-modules";
import { StagePicker } from "@/components/cockpit/quick-launch/stage-picker";
import { BuildProductNameCard } from "@/components/cockpit/build/build-product-name-card";
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
    productName?: string;
  }) => void;
};

export function QuickLaunchSheet({
  opportunity,
  open,
  onOpenChange,
  onLaunch,
}: QuickLaunchSheetProps) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { addProject } = usePortfolio();
  const [stage, setStage] = useState<BuilderStage>("starting");
  const [productName, setProductName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const teaser = getLaunchTeaser(opportunity);

  const handleSubmit = async () => {
    setSubmitError(null);
    const defaults = getQuickLaunchDefaults(stage);
    const trimmedName = productName.trim();
    const project = addProject(opportunity.slug, {
      ...defaults,
      ...(trimmedName ? { productName: trimmedName } : {}),
    });
    if (!project) {
      setSubmitError("Impossible de créer le projet. Réessayez dans un instant.");
      return;
    }

    setSubmitting(true);
    try {
      const launchInput = {
        ...defaults,
        ...(trimmedName ? { productName: trimmedName } : {}),
      };

      if (isAuthenticated) {
        const synced = await uploadAccountProject(project);
        if (!synced) {
          setSubmitError("Le projet n'a pas pu être enregistré. Vérifiez votre connexion.");
          return;
        }
      }

      onLaunch(launchInput);
      onOpenChange(false);
      router.push(getCockpitHref(project.id, "build"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Prêt à builder ?</DialogTitle>
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

          <BuildProductNameCard
            opportunity={opportunity}
            value={productName}
            onChange={setProductName}
            compact
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          {submitError ? (
            <p className="w-full text-center text-sm text-destructive">{submitError}</p>
          ) : null}
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Plus tard
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Création…" : "Lancer mon build"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

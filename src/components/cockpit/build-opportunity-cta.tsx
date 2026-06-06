"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Rocket } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { usePortfolio } from "@/contexts/portfolio-context";
import { getScenarioMrr, type TargetScenario } from "@/lib/portfolio";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const SCENARIOS: TargetScenario[] = ["Prudent", "Réaliste", "Optimiste"];

type BuildOpportunityCtaProps = {
  opportunity: Opportunity;
  variant?: "header" | "sticky";
  className?: string;
};

export function BuildOpportunityCta({
  opportunity,
  variant = "header",
  className,
}: BuildOpportunityCtaProps) {
  const router = useRouter();
  const { hydrated, getProjectBySlug, addProject } = usePortfolio();
  const existing = hydrated ? getProjectBySlug(opportunity.slug) : undefined;

  const [open, setOpen] = useState(false);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [currentMrr, setCurrentMrr] = useState("0");
  const [targetScenario, setTargetScenario] = useState<TargetScenario>("Réaliste");

  const handleSubmit = () => {
    const project = addProject(opportunity.slug, {
      startedAt,
      currentMrr: Number(currentMrr) || 0,
      targetScenario,
    });
    setOpen(false);
    if (project) router.push(`/cockpit/${project.id}`);
  };

  if (existing) {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <Badge variant="outline" className="border-primary/30 text-primary">
          En build
        </Badge>
        <Button variant="outline" asChild className={variant === "sticky" ? "flex-1" : ""}>
          <Link href={`/cockpit/${existing.id}`}>
            Voir mon cockpit
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        type="button"
        className={cn(
          variant === "header" ? "w-full sm:w-auto" : "flex-1",
          variant === "sticky" && "shadow-lg",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Rocket className="h-4 w-4" />
        Je build cette opportunité
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lancer « {opportunity.name} »</DialogTitle>
            <DialogDescription>
              SaaS Radar suivra votre progression face à la promesse de la fiche. Quelques secondes
              pour démarrer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="started-at">Quand avez-vous commencé ?</Label>
              <input
                id="started-at"
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-mrr">MRR actuel</Label>
              <div className="relative">
                <input
                  id="current-mrr"
                  type="number"
                  min={0}
                  step={1}
                  value={currentMrr}
                  onChange={(e) => setCurrentMrr(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
              </div>
              <p className="text-xs text-muted-foreground">0 € si vous démarrez — c&apos;est honnête.</p>
            </div>

            <div className="space-y-2">
              <Label>Objectif visé</Label>
              <div className="flex flex-wrap gap-2">
                {SCENARIOS.map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    onClick={() => setTargetScenario(scenario)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      targetScenario === scenario
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {scenario} · {formatCurrency(getScenarioMrr(opportunity, scenario))}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Plus tard
            </Button>
            <Button onClick={handleSubmit}>
              Ouvrir mon cockpit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

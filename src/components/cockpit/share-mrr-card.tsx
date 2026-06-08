"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import { getTargetMrr, getPromiseGapPercent } from "@/lib/portfolio";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/contexts/portfolio-context";

type ShareMrrCardProps = {
  project: UserProject;
  projectName: string;
};

export function ShareMrrCard({ project, projectName }: ShareMrrCardProps) {
  const { getCatalogOpportunity } = usePortfolio();
  const opportunity = getCatalogOpportunity(project.opportunitySlug);
  const [copied, setCopied] = useState(false);
  const target = opportunity ? getTargetMrr(project, opportunity) : 0;
  const gap = opportunity ? getPromiseGapPercent(project, opportunity) : null;

  const text = [
    `🚀 ${projectName}`,
    `MRR actuel : ${formatCurrency(project.currentMrr)}`,
    `Promesse Radar (${project.targetScenario}) : ${formatCurrency(target)}`,
    gap !== null ? `Écart : ${gap >= 0 ? "+" : ""}${gap} %` : "",
    "",
    "Suivi avec SaaS Radar — intelligence micro-SaaS pour la France",
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-card p-6 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
        Partager ma progression
      </p>
      <div className="mt-4 rounded-lg border border-border bg-background p-4">
        <p className="font-display text-lg font-medium">{projectName}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">MRR réel</p>
            <p className="font-data text-xl font-semibold text-primary">
              {formatCurrency(project.currentMrr)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Promesse</p>
            <p className="font-data text-xl font-semibold">{formatCurrency(target)}</p>
          </div>
        </div>
        {gap !== null ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {gap >= 0
              ? `+${gap} % vs scénario ${project.targetScenario.toLowerCase()}`
              : `${gap} % vs scénario ${project.targetScenario.toLowerCase()}`}
          </p>
        ) : null}
      </div>
      <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copié !" : "Copier pour LinkedIn / X"}
      </Button>
    </section>
  );
}

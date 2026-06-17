"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getNextActionMessage } from "@/lib/portfolio";
import type { RadarAction } from "@/lib/radar-intelligence";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { Button } from "@/components/ui/button";

type NextActionCardProps = {
  project: UserProject;
  opportunity: Opportunity;
  radarAction?: RadarAction;
  onModuleChange?: (module: CockpitModuleId) => void;
};

export function NextActionCard({
  project,
  opportunity,
  radarAction,
  onModuleChange,
}: NextActionCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = radarAction?.rationale ?? getNextActionMessage(project, opportunity);
  const title = radarAction?.title ?? "Prochaine action";
  const channel = opportunity.acquisition[0];

  const openPlaybookClients = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("module", "playbook");
    params.set("tab", "clients");
    router.replace(`?${params.toString()}`, { scroll: false });
    onModuleChange?.("playbook");
  };

  return (
    <section className="rounded-xl border border-primary/30 bg-accent/40 p-6">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{message}</p>
      {radarAction && onModuleChange ? (
        <Button
          className="mt-4 gap-2"
          size="sm"
          variant="outline"
          onClick={() => onModuleChange(radarAction.actionModule)}
        >
          {radarAction.actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : channel ? (
        <Button className="mt-4 gap-2" size="sm" variant="outline" onClick={openPlaybookClients}>
          Voir le canal {channel.title}
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : null}
    </section>
  );
}

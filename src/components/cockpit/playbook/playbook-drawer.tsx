"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PlaybookContent,
  type PlaybookTab,
  isPlaybookTab,
} from "@/components/cockpit/playbook/playbook-content";

type PlaybookDrawerProps = {
  opportunity: Opportunity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
  project?: UserProject;
  data?: CockpitData;
  onModuleChange?: (module: CockpitModuleId) => void;
};

export function PlaybookDrawer({
  opportunity,
  open,
  onOpenChange,
  defaultTab = "opportunity",
  project,
  data,
  onModuleChange,
}: PlaybookDrawerProps) {
  const resolvedDefault = isPlaybookTab(defaultTab) ? defaultTab : "opportunity";
  const [activeTab, setActiveTab] = useState<PlaybookTab>(resolvedDefault);

  useEffect(() => {
    if (isPlaybookTab(defaultTab)) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, open]);

  const fullscreenHref = project
    ? `/cockpit/${project.id}?module=playbook&tab=${activeTab}`
    : `/opportunities/${opportunity.slug}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <DialogTitle>Playbook · {opportunity.name}</DialogTitle>
              <DialogDescription className="mt-1">
                Recherche et ressources pour builder — sans quitter le cockpit.
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={fullscreenHref} onClick={() => onOpenChange(false)}>
                Ouvrir dans Playbook
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <PlaybookContent
            opportunity={opportunity}
            defaultTab={defaultTab}
            showHeader={false}
            project={project}
            data={data}
            onModuleChange={onModuleChange}
            onTabChange={setActiveTab}
            inDrawer
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

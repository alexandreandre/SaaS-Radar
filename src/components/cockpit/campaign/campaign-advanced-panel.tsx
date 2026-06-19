"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { CampaignToolSwitcher } from "@/components/cockpit/campaign/campaign-tool-switcher";
import {
  CampaignToolPickerDialog,
} from "@/components/cockpit/campaign/campaign-tool-picker";
import { CampaignWorkflowDiagram } from "@/components/cockpit/campaign/campaign-workflow-diagram";
import { Button } from "@/components/ui/button";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { CampaignWorkflowNode } from "@/lib/campaign/workflows";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { CampaignToolId } from "@/lib/campaign/tools";

type CampaignAdvancedPanelProps = {
  project: UserProject;
  opportunity: Opportunity;
  profile: MarketingProfile;
  channel: ExtendedChannelKey;
  workflow: CampaignWorkflowNode[];
  onModuleChange: (module: CockpitModuleId) => void;
  onSwitchTool: (toolId: CampaignToolId) => void;
  onRemoveTool: (toolId: CampaignToolId) => void;
  onAddTool: (tool: CampaignTool) => void;
};

export function CampaignAdvancedPanel({
  project,
  opportunity,
  profile,
  channel,
  workflow,
  onModuleChange,
  onSwitchTool,
  onRemoveTool,
  onAddTool,
}: CampaignAdvancedPanelProps) {
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const multiTools = (project.campaignSetup?.activeToolIds?.length ?? 0) > 1;

  return (
    <details className="rounded-lg border border-border/60 bg-muted/5">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        Options avancées
      </summary>
      <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-3">
        <CampaignToolSwitcher
          project={project}
          onSwitch={onSwitchTool}
          onRemove={onRemoveTool}
          onAddTool={() => setToolDialogOpen(true)}
        />
        <CampaignToolPickerDialog
          open={toolDialogOpen}
          onOpenChange={setToolDialogOpen}
          project={project}
          opportunity={opportunity}
          profile={profile}
          channel={channel}
          selectedToolIds={project.campaignSetup?.activeToolIds}
          onSelect={(tool) => {
            onAddTool(tool);
            setToolDialogOpen(false);
          }}
        />
        {multiTools ? <CampaignWorkflowDiagram workflow={workflow} /> : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onModuleChange("playbook")}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Voir les tactiques marché dans Idée
        </Button>
      </div>
    </details>
  );
}

"use client";

import type { CampaignWorkflowNode } from "@/lib/campaign/workflows";
import { getCampaignTool } from "@/lib/campaign/tools";
import { ArrowDown, ArrowRight } from "lucide-react";

type CampaignWorkflowDiagramProps = {
  workflow: CampaignWorkflowNode[];
};

export function CampaignWorkflowDiagram({ workflow }: CampaignWorkflowDiagramProps) {
  if (workflow.length === 0) return null;

  const series = workflow.filter((n) => n.mode === "series");
  const parallel = workflow.filter((n) => n.mode === "parallel");

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
        Workflow
      </p>
      <div className="mt-3 space-y-4">
        {series.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {series.map((node, i) => (
              <div key={node.toolId} className="flex items-center gap-2">
                <WorkflowNode node={node} />
                {i < series.length - 1 ? (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {parallel.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {parallel.map((node) => (
              <WorkflowNode key={node.toolId} node={node} />
            ))}
          </div>
        ) : null}
        {series.length > 0 && parallel.length > 0 ? (
          <div className="flex justify-center">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function WorkflowNode({ node }: { node: CampaignWorkflowNode }) {
  const tool = getCampaignTool(node.toolId);
  return (
    <span className="inline-flex items-center rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm">
      {tool?.name ?? node.label}
      <span className="ml-2 text-[10px] uppercase text-muted-foreground">
        {node.mode === "parallel" ? "∥" : "→"}
      </span>
    </span>
  );
}

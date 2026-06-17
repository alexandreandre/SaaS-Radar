"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { resolveProductName } from "@/lib/portfolio";
import { usePortfolio } from "@/contexts/portfolio-context";
import { ProductNameEditor } from "@/components/cockpit/product-name-editor";
import { ProductLogoImage } from "@/components/cockpit/product-logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CockpitProjectIdentityProps = {
  project: UserProject;
  opportunity: Opportunity;
  collapsed?: boolean;
  className?: string;
};

export function CockpitProjectIdentity({
  project,
  opportunity,
  collapsed = false,
  className,
}: CockpitProjectIdentityProps) {
  const { setProductName } = usePortfolio();
  const displayName = resolveProductName(project, opportunity);

  if (collapsed) {
    return (
      <div className={cn("mb-3 flex justify-center border-b border-border/60 pb-3", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <ProductLogoImage logo={project.productLogo} size="sm" alt={displayName} />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">{displayName}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={cn("mb-3 border-b border-border/60 pb-3", className)}>
      <div className="flex items-start gap-2.5">
        <ProductLogoImage logo={project.productLogo} size="sm" alt={displayName} />
        <div className="min-w-0 flex-1">
          <ProductNameEditor
            value={displayName}
            onSave={(name) => setProductName(project.id, name)}
            size="sidebar"
          />
        </div>
      </div>
    </div>
  );
}

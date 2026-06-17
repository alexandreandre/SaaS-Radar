"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { CockpitSidebar } from "@/components/cockpit/cockpit-sidebar";
import { CockpitProjectIdentity } from "@/components/cockpit/cockpit-project-identity";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitAlert } from "@/lib/cockpit-alerts";

type CockpitNavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeModule: CockpitModuleId;
  onModuleChange: (module: CockpitModuleId) => void;
  alerts: CockpitAlert[];
  opportunity: Opportunity;
  project: UserProject;
};

export function CockpitNavDrawer({
  open,
  onOpenChange,
  activeModule,
  onModuleChange,
  alerts,
  opportunity,
  project,
}: CockpitNavDrawerProps) {
  const handleModuleChange = (module: CockpitModuleId) => {
    onModuleChange(module);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,280px)] flex-col border-r border-border bg-background shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        >
          <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="sr-only">Navigation cockpit</DialogTitle>
              <DialogDescription className="sr-only">
                Choisir un module du cockpit
              </DialogDescription>
              <CockpitProjectIdentity
                project={project}
                opportunity={opportunity}
                className="mb-0 border-b-0 pb-0"
              />
            </div>
            <DialogPrimitive.Close className="mt-0.5 shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <CockpitSidebar
              activeModule={activeModule}
              onModuleChange={handleModuleChange}
              alerts={alerts}
              opportunity={opportunity}
              showCollapseToggle={false}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

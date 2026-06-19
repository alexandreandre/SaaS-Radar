"use client";

import { useState } from "react";
import { History, MoreHorizontal, RotateCcw } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import { getActiveCampaignToolId } from "@/lib/portfolio";
import type { CampaignTool } from "@/lib/campaign/tools";
import { getCampaignTool } from "@/lib/campaign/tools";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ResetCampaignOptions } from "@/lib/portfolio";

type CampaignControlsProps = {
  project: UserProject;
  currentTool?: CampaignTool;
  onRestoreVersion: (savedAt: string) => void;
  onReset: (opts?: ResetCampaignOptions) => void;
};

export function CampaignControls({
  project,
  currentTool,
  onRestoreVersion,
  onReset,
}: CampaignControlsProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [keepStrategy, setKeepStrategy] = useState(true);
  const [keepHistory, setKeepHistory] = useState(false);
  const [clearAllTools, setClearAllTools] = useState(false);

  const activeToolId = getActiveCampaignToolId(project);
  const toolLabel = currentTool?.name ?? activeToolId ?? "cet outil";
  const history = (project.campaignSetupHistory ?? []).filter(
    (snap) => !activeToolId || snap.toolId === activeToolId,
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
            aria-label="Options du kit campagne"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {history.length > 0 ? (
            <DropdownMenuItem onSelect={() => setHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              Versions précédentes
              <span className="ml-auto text-xs text-muted-foreground">{history.length}</span>
            </DropdownMenuItem>
          ) : null}
          {history.length > 0 ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setResetOpen(true)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Repartir de zéro
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Versions précédentes</DialogTitle>
            <DialogDescription>
              Kits sauvegardés pour {toolLabel} avant une régénération.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-64 space-y-1 overflow-y-auto py-1">
            {history.map((snap) => {
              const snapTool = getCampaignTool(snap.toolId);
              return (
                <li key={snap.savedAt}>
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreVersion(snap.savedAt);
                      setHistoryOpen(false);
                    }}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium">{snapTool?.name ?? snap.toolId}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {new Date(snap.savedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repartir de zéro ?</DialogTitle>
            <DialogDescription>
              Par défaut, seul le kit de {toolLabel} est effacé. Les autres outils restent
              disponibles dans la barre « Mes outils ».
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="flex items-center gap-3 text-sm">
              <Checkbox checked={keepStrategy} onCheckedChange={(v) => setKeepStrategy(v === true)} />
              Garder le brief stratégie
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox checked={keepHistory} onCheckedChange={(v) => setKeepHistory(v === true)} />
              Garder l&apos;historique des versions
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={clearAllTools}
                onCheckedChange={(v) => setClearAllTools(v === true)}
              />
              Effacer tous les kits (tous les outils)
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="default"
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={() => {
                onReset({
                  keepStrategy,
                  keepHistory,
                  clearAllKits: clearAllTools,
                });
                setResetOpen(false);
              }}
            >
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

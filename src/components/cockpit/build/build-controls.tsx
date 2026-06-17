"use client";

import { useState } from "react";
import { History, MoreHorizontal, RotateCcw } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import { getActiveBuildToolId } from "@/lib/portfolio";
import type { BuildTool } from "@/lib/build/tools";
import { BuildToolLogo } from "@/components/cockpit/build/build-tool-logo";
import { getBuildTool } from "@/lib/build/tools";
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

type BuildControlsProps = {
  project: UserProject;
  currentTool?: BuildTool;
  onRestoreVersion: (savedAt: string) => void;
  onReset: (opts: {
    keepRoadmap?: boolean;
    keepHistory?: boolean;
    keepTool?: boolean;
    clearAllBuildKits?: boolean;
  }) => void;
};

export function BuildControls({
  project,
  currentTool,
  onRestoreVersion,
  onReset,
}: BuildControlsProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [keepRoadmap, setKeepRoadmap] = useState(true);
  const [keepHistory, setKeepHistory] = useState(false);
  const [clearAllKits, setClearAllKits] = useState(false);

  const activeToolId = getActiveBuildToolId(project);
  const toolLabel = currentTool?.name ?? activeToolId ?? "cet outil";
  const history = (project.buildSetupHistory ?? []).filter(
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
            aria-label="Options du kit"
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
              const snapTool = getBuildTool(snap.toolId);
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
                    <span className="inline-flex items-center gap-2 font-medium">
                      {snapTool ? (
                        <BuildToolLogo toolId={snapTool.id} size="xs" variant="inline" />
                      ) : null}
                      {snapTool?.name ?? snap.toolId}
                    </span>
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
              <Checkbox checked={keepRoadmap} onCheckedChange={(v) => setKeepRoadmap(v === true)} />
              Garder la progression roadmap (étapes cochées)
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox checked={keepHistory} onCheckedChange={(v) => setKeepHistory(v === true)} />
              Garder l&apos;historique des versions
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={clearAllKits}
                onCheckedChange={(v) => setClearAllKits(v === true)}
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
                  keepRoadmap,
                  keepHistory,
                  keepTool: false,
                  clearAllBuildKits: clearAllKits,
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

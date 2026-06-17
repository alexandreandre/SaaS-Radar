"use client";

import { useState } from "react";
import { History, RotateCcw, Settings2, Wrench } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import type { BuildTool } from "@/lib/build/tools";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

type BuildControlsProps = {
  project: UserProject;
  currentTool?: BuildTool;
  onChangeTool: () => void;
  onRestoreVersion: (savedAt: string) => void;
  onReset: (opts: {
    keepRoadmap?: boolean;
    keepHistory?: boolean;
    keepTool?: boolean;
  }) => void;
};

export function BuildControls({
  project,
  currentTool,
  onChangeTool,
  onRestoreVersion,
  onReset,
}: BuildControlsProps) {
  const [resetOpen, setResetOpen] = useState(false);
  const [keepRoadmap, setKeepRoadmap] = useState(true);
  const [keepHistory, setKeepHistory] = useState(false);
  const [keepTool, setKeepTool] = useState(false);
  const history = project.buildSetupHistory ?? [];

  return (
    <>
      <details className="rounded-xl border border-border/60 bg-muted/10">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm marker:content-none [&::-webkit-details-marker]:hidden">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Gérer mon build</span>
        </summary>
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onChangeTool}>
            <Wrench className="h-3.5 w-3.5" />
            Changer d&apos;outil
            {currentTool ? ` (actuel : ${currentTool.name})` : ""}
          </Button>

          {history.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                Versions précédentes
              </p>
              <ul className="space-y-1">
                {history.map((snap) => (
                  <li key={snap.savedAt}>
                    <button
                      type="button"
                      onClick={() => onRestoreVersion(snap.savedAt)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs hover:bg-muted/50"
                    >
                      <span className="font-medium">{snap.toolId}</span>
                      <span className="ml-2 text-muted-foreground">
                        {new Date(snap.savedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Repartir de zéro
          </Button>
        </div>
      </details>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repartir de zéro ?</DialogTitle>
            <DialogDescription>
              Choisissez ce que vous souhaitez conserver avant de réinitialiser votre session build.
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
              <Checkbox checked={keepTool} onCheckedChange={(v) => setKeepTool(v === true)} />
              Garder l&apos;outil sélectionné
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
                onReset({ keepRoadmap, keepHistory, keepTool });
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

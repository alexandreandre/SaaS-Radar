"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CockpitModuleId } from "@/lib/cockpit-modules";

const WELCOME_KEY = "saas-radar:cockpit-welcome-dismissed";

type CockpitWelcomeBannerProps = {
  projectId: string;
  onModuleChange: (module: CockpitModuleId) => void;
  onDismiss?: () => void;
};

export function CockpitWelcomeBanner({
  projectId,
  onModuleChange,
  onDismiss,
}: CockpitWelcomeBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `${WELCOME_KEY}:${projectId}`;
    setVisible(!sessionStorage.getItem(key));
  }, [projectId]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(`${WELCOME_KEY}:${projectId}`, "1");
    setVisible(false);
    onDismiss?.();
  }, [projectId, onDismiss]);

  if (!visible) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-relaxed">
        Votre fiche est prête — business model, concurrence et plan dans{" "}
        <strong className="font-medium text-foreground">Idée</strong>.
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => { dismiss(); onModuleChange("build"); }}>
          Commencer le build
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => { dismiss(); onModuleChange("playbook"); }}
        >
          Voir ma fiche
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-sm p-1 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

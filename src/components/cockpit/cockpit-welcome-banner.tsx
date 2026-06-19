"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { CockpitModuleId } from "@/lib/cockpit-modules";

const WELCOME_KEY = "saas-radar:cockpit-welcome-dismissed";

type CockpitWelcomeBannerProps = {
  projectId: string;
  onModuleChange: (module: CockpitModuleId) => void;
  onDismiss?: () => void;
};

function ModuleLink({
  module,
  label,
  onNavigate,
}: {
  module: CockpitModuleId;
  label: string;
  onNavigate: (module: CockpitModuleId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(module)}
      className="font-medium text-primary underline-offset-2 transition-colors hover:text-primary/80 hover:underline"
    >
      {label}
    </button>
  );
}

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

  const navigate = useCallback(
    (module: CockpitModuleId) => {
      onModuleChange(module);
    },
    [onModuleChange],
  );

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
        Fiche générée — avancez sur{" "}
        <ModuleLink module="build" label="Build" onNavigate={navigate} />{" "}
        (roadmap, prompts IA, suivi quotidien). Business model, concurrence et plan détaillé dans{" "}
        <ModuleLink module="playbook" label="Idée" onNavigate={navigate} />. Pour lancer
        l&apos;acquisition, passez par{" "}
        <ModuleLink module="campagne" label="Campagne" onNavigate={navigate} />.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-sm p-1 text-muted-foreground hover:text-foreground"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

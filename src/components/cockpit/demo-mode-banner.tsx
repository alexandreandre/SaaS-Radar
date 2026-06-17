import { Beaker } from "lucide-react";

export function DemoModeBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-900">
      <Beaker className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Mode démo — données simulées</p>
        <p className="mt-0.5 text-violet-800/80">
          Les métriques proviennent de connecteurs en mode démo. Branchez vos vrais comptes dans
          l&apos;onglet Connecteurs pour un pilotage réel.
        </p>
      </div>
    </div>
  );
}

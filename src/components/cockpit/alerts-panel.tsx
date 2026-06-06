import Link from "next/link";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { CockpitAlert } from "@/lib/cockpit-alerts";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { cn } from "@/lib/utils";

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const STYLES = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-900",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-900",
  critical: "border-red-500/30 bg-red-500/10 text-red-900",
};

export function AlertsPanel({
  alerts,
  onModuleChange,
  /** @deprecated use onModuleChange */
  onTabChange,
}: {
  alerts: CockpitAlert[];
  onModuleChange?: (module: CockpitModuleId) => void;
  onTabChange?: (tab: string) => void;
}) {
  const navigate = onModuleChange ?? onTabChange;

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
        Aucune alerte — votre SaaS est sur la bonne trajectoire.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const Icon = ICONS[alert.severity];
        const moduleId = alert.actionModule ?? alert.actionTab ?? "overview";
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
              STYLES[alert.severity]
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p>{alert.message}</p>
              {navigate ? (
                <button
                  type="button"
                  onClick={() => navigate(moduleId as CockpitModuleId)}
                  className="mt-1 text-xs font-medium underline underline-offset-2"
                >
                  Voir le détail
                </button>
              ) : (
                <Link href="#" className="mt-1 text-xs font-medium underline">
                  Voir le détail
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
